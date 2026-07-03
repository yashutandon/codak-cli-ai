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
import { runMultiAgent, runPlanner } from "../../service/planner.service";
import { updateProjectMemory, buildMemoryContext } from "../../service/project-memory";
import { loadCodakRules, invalidateCodakRulesCache } from "../../service/codak-rules.service";
import { detectComplexity } from "../../infra/agents/orchestrator";
import { findSupportedChatModel } from "@codak/shared";

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

function toSSEStream(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of text.split("\n")) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "text-delta", text: line + "\n" })}\n\n`)
        );
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
      );
      controller.close();
    },
  });
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
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!session) throw new AppError("Session not found", 404);

  const cwd = session.cwd ?? process.cwd();

  // Gather all context in parallel
  const [pm, codakRules, memoryContext] = await Promise.all([
    detectPackageManager(cwd),
    loadCodakRules(cwd),
    buildMemoryContext(sessionId),
  ]);

  // Fire-and-forget memory update
  updateProjectMemory(sessionId, { packageManager: pm.name }).catch(console.error);

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

  // RAG retrieval
  let ragContext = "";
  if (await getIndexingStatus(sessionId) === "done") {
    try {
      ragContext = await retrieveRelevantChunks(sessionId, data.content);
    } catch (err) {
      console.error("[RAG] Retrieval failed:", err);
    }
  }

  // Build full context: RAG + project memory + codak.md rules
  const contextParts: string[] = [];
  if (ragContext) contextParts.push(ragContext);
  if (memoryContext) contextParts.push(memoryContext);
  if (codakRules) {
    contextParts.push(`<project_rules>\n${codakRules}\n</project_rules>`);
  }
  const fullContext = contextParts.join("\n\n");

  // ─── PLAN mode ─────────────────────────────────────────────────
  if (data.mode === "PLAN") {
    const plan = await runPlanner(data.content, cwd, fullContext, data.model, history, data.images);

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
    return { isPlanner: true, planStream: toSSEStream(plan) };
  }

  // ─── BUILD mode — complex task (multi-agent) ───────────────────
  // Delegate to single source of truth for complexity detection
  const isComplex = detectComplexity(data.content);

  if (isComplex) {
    const result = await runMultiAgent(data.content, cwd, fullContext, data.model, history, data.images);

    await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: result,
        mode: data.mode,
        model: data.model,
        status: "COMPLETE",
        title: "",
      },
    });

    await invalidateSessionCache(sessionId, userId);
    return { isPlanner: true, planStream: toSSEStream(result) };
  }

  const currentUserMessage = data.images?.length
    ? {
        role: "user" as const,
        content: [
          { type: "text" as const, text: data.content },
          ...data.images.map((img) => ({ type: "image" as const, image: img })),
        ],
      }
    : { role: "user" as const, content: data.content };

  const result = streamText({
    model: getModel(data.model),
    system: getSystemPrompt(cwd, fullContext, pm.name),
    messages: [...history, currentUserMessage],
    tools: buildTools(cwd, sessionId),
    // @ts-ignore
    stopWhen: stepCountIs(10),
    onFinish: async ({ text, steps, usage }) => {
      const finalContent =
        steps.map((s: any) => s.text ?? "").filter(Boolean).join("\n").trim() || text || "";

      // Calculate cost in USD
      const modelDef = findSupportedChatModel(data.model);
      const pricing = modelDef?.pricing;
      let costUsd: number | undefined;
      if (pricing && usage) {
        costUsd =
          ((usage.inputTokens ?? 0) * pricing.inputUsedMillionTokens) / 1_000_000 +
          ((usage.outputTokens ?? 0) * pricing.outputUsedMillionTokens) / 1_000_000;
      }

      const part = usage
        ? {
            promptTokens: usage.inputTokens ?? 0,
            completionTokens: usage.outputTokens ?? 0,
            totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            costUsd,
          }
        : undefined;

      await db.message.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: finalContent,
          mode: data.mode,
          model: data.model,
          status: "COMPLETE",
          title: "",
          part: part ?? undefined,
        },
      });

      // Invalidate codak.md cache if agent edited it
      const editedFiles = steps.flatMap((s: any) =>
        (s.toolCalls ?? [])
          .filter((tc: any) => tc.toolName === "write_file" || tc.toolName === "edit_file")
          .map((tc: any) => String(tc.args?.path ?? tc.input?.path ?? ""))
      );

      if (editedFiles.some((f) => f.endsWith(".codakrules") || f.endsWith(".codak") || f.endsWith("codak.md"))) {
        await invalidateCodakRulesCache(cwd);
        console.log("[rules] Cache invalidated after agent edit");
      }

      await invalidateSessionCache(sessionId, userId);
    },
  });

  return { isPlanner: false, result };
}