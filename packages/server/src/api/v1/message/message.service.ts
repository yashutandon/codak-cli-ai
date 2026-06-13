import { streamText, stepCountIs, tool, type StreamTextResult } from "ai";
import { db } from "@codak/database";
import { tools as toolDefinitions, type ToolName } from "@codak/shared";
import { AppError } from "../../../utils/AppError";
import { redis } from "../../infra";
import { executeTool } from "../../lib/tools";
import type { SendMessageDto } from "./message.dto";
import { getIndexingStatus, retrieveRelevantChunks } from "../../infra/embeddings";
import { getSystemPrompt } from "../../lib/constants/system-prompt";
import { detectPackageManager } from "../../lib/tools/build/detect-package-manager";
import { getModel } from "../../model/get-model";
import { runPlanner } from "../../service/planner.service";
import { updateProjectMemory, buildMemoryContext } from "../../service/project-memory";

const SESSION_CACHE_TTL = 60 * 5;

type PlanResponse = {
  isPlanner: true;
  planStream: ReadableStream;
  result?: never;
};

type BuildResponse = {
  isPlanner: false;
  result: StreamTextResult<any, any>;
  planStream?: never;
};

type MessageResponse = PlanResponse | BuildResponse;

async function invalidateSessionCache(sessionId: string, userId: string) {
  await redis.del(`session:${sessionId}:${userId}`);
}

function buildTools(cwd: string, sessionId: string) {
  const makeExecute = (name: ToolName) => async (args: Record<string, unknown>) =>
    executeTool(name, args, cwd, sessionId);

  return {
    // File tools
    read_file:        tool({ description: toolDefinitions.read_file.description,        inputSchema: toolDefinitions.read_file.parameters,        execute: makeExecute("read_file") }),
    write_file:       tool({ description: toolDefinitions.write_file.description,       inputSchema: toolDefinitions.write_file.parameters,       execute: makeExecute("write_file") }),
    edit_file:        tool({ description: toolDefinitions.edit_file.description,        inputSchema: toolDefinitions.edit_file.parameters,        execute: makeExecute("edit_file") }),
    list_files:       tool({ description: toolDefinitions.list_files.description,       inputSchema: toolDefinitions.list_files.parameters,       execute: makeExecute("list_files") }),
    run_command:      tool({ description: toolDefinitions.run_command.description,      inputSchema: toolDefinitions.run_command.parameters,      execute: makeExecute("run_command") }),
    create_directory: tool({ description: toolDefinitions.create_directory.description, inputSchema: toolDefinitions.create_directory.parameters, execute: makeExecute("create_directory") }),
    delete_file:      tool({ description: toolDefinitions.delete_file.description,      inputSchema: toolDefinitions.delete_file.parameters,      execute: makeExecute("delete_file") }),
    search_files:     tool({ description: toolDefinitions.search_files.description,     inputSchema: toolDefinitions.search_files.parameters,     execute: makeExecute("search_files") }),

    // Git tools
    git_status:        tool({ description: toolDefinitions.git_status.description,        inputSchema: toolDefinitions.git_status.parameters,        execute: makeExecute("git_status") }),
    git_diff:          tool({ description: toolDefinitions.git_diff.description,          inputSchema: toolDefinitions.git_diff.parameters,          execute: makeExecute("git_diff") }),
    git_commit:        tool({ description: toolDefinitions.git_commit.description,        inputSchema: toolDefinitions.git_commit.parameters,        execute: makeExecute("git_commit") }),
    git_checkout:      tool({ description: toolDefinitions.git_checkout.description,      inputSchema: toolDefinitions.git_checkout.parameters,      execute: makeExecute("git_checkout") }),
    git_log:           tool({ description: toolDefinitions.git_log.description,           inputSchema: toolDefinitions.git_log.parameters,           execute: makeExecute("git_log") }),
    git_create_branch: tool({ description: toolDefinitions.git_create_branch.description, inputSchema: toolDefinitions.git_create_branch.parameters, execute: makeExecute("git_create_branch") }),
  };
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  data: SendMessageDto
): Promise<MessageResponse> {
  await invalidateSessionCache(sessionId, userId);

  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 10 },
    },
  });

  if (!session) throw new AppError("Session not found", 404);

  const cwd = session.cwd ?? process.cwd();
  const pm = await detectPackageManager(cwd);

  await updateProjectMemory(sessionId, { packageManager: pm.name });
  const memoryContext = await buildMemoryContext(sessionId);

  await db.message.create({
    data: {
      sessionId,
      role: "USER",
      content: data.content,
      mode: data.mode,
      model: data.model,
      status: "COMPLETE",
      title: "",
    },
  });

  const history = session.messages
    .filter((m: any) => m.content?.trim())
    .map((m: any) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  let ragContext = "";
  const indexingStatus = getIndexingStatus(sessionId);
  if (indexingStatus === "done") {
    try {
      ragContext = await retrieveRelevantChunks(sessionId, data.content);
    } catch (err) {
      console.error("[RAG] Retrieval failed:", err);
    }
  }

  const fullRagContext = [ragContext, memoryContext].filter(Boolean).join("\n\n");

  // PLAN mode
  if (data.mode === "PLAN") {
    const plan = await runPlanner(
      data.content,
      cwd,
      fullRagContext,
      data.model,
      history
    );

    await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: plan,
        mode: data.mode,
        model: data.model,
        status: "COMPLETE",
        title: "",
      },
    });

    await invalidateSessionCache(sessionId, userId);

    const encoder = new TextEncoder();
    const planStream = new ReadableStream({
      start(controller) {
        const lines = plan.split("\n");
        for (const line of lines) {
          const chunk = JSON.stringify({ type: "text-delta", text: line + "\n" });
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      },
    });

    return { isPlanner: true, planStream };
  }

  // BUILD mode
  const result = streamText({
    model: getModel(data.model),
    system: getSystemPrompt(cwd, fullRagContext, pm.name),
    messages: [...history, { role: "user" as const, content: data.content }],
    tools: buildTools(cwd, sessionId),
    // @ts-ignore
    stopWhen: stepCountIs(10),
    onFinish: async ({ text, steps }) => {
      const fullText = steps
        .map((s: any) => s.text ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();

      const finalContent = fullText || text || "";

      await db.message.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: finalContent,
          mode: data.mode,
          model: data.model,
          status: "COMPLETE",
          title: "",
        },
      });

      await invalidateSessionCache(sessionId, userId);
    },
  });

  return { isPlanner: false, result };
}