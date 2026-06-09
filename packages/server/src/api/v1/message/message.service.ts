import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { db } from "@codak/database";
import { findSupportedChatModel, tools as toolDefinitions } from "@codak/shared";
import { AppError } from "../../../utils/AppError";
import { redis } from "../../infra";
import { executeTool } from "../../lib/tools";
import type { SendMessageDto } from "./message.dto";
import { getIndexingStatus, retrieveRelevantChunks } from "../../infra/embeddings";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const SESSION_CACHE_TTL = 60 * 5;

function getModel(modelId: string) {
  const found = findSupportedChatModel(modelId) as
    | { id: string; provider: string }
    | undefined;
  if (!found) throw new AppError(`Unsupported model: ${modelId}`, 400);

  switch (found.provider) {
    case "anthropic": return anthropic(modelId as Parameters<typeof anthropic>[0]);
    case "google":    return google(modelId as Parameters<typeof google>[0]);
    case "groq":      return groq(modelId);
    case "openai":    return openai(modelId as Parameters<typeof openai>[0]);
    default: throw new AppError(`Unsupported provider: ${found.provider}`, 400);
  }
}

async function getSessionWithCache(sessionId: string, userId: string) {
  const cacheKey = `session:${sessionId}:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }, // ← FIX: asc order, no reverse needed
        take: 10,
      },
    },
  });

  if (session) {
    await redis.setex(cacheKey, SESSION_CACHE_TTL, JSON.stringify(session));
  }

  return session;
}

async function invalidateSessionCache(sessionId: string, userId: string) {
  await redis.del(`session:${sessionId}:${userId}`);
}

function buildTools(cwd: string): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [name, def] of Object.entries(toolDefinitions)) {
    result[name] = {
      description: def.description,
      parameters: def.parameters,
      execute: async (args: Record<string, unknown>) => {
        try {
          return await executeTool(name as any, args as any, cwd);
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    };
  }

  return result;
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  data: SendMessageDto
) {
  // FIX: pehle cache invalidate, phir session fetch
  await invalidateSessionCache(sessionId, userId);
  
  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }, // ← FIX: asc
        take: 10,
      },
    },
  });
  
  if (!session) throw new AppError("Session not found", 404);

  const cwd = session.cwd ?? process.cwd();

  // User message save karo
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

  // History build karo — REMOVED enrichUserMessage (ye bug tha)
  const history = session.messages
    .filter((m: any) => m.content?.trim())
    .map((m: any) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  // RAG context
  let ragContext = "";
  const indexingStatus = getIndexingStatus(sessionId);
  if (indexingStatus === "done") {
    try {
      ragContext = await retrieveRelevantChunks(sessionId, data.content);
    } catch (err) {
      console.error("[RAG] Retrieval failed:", err);
    }
  }

  const result = streamText({
    model: getModel(data.model),
    system: `You are Codak, an AI coding assistant running in a terminal (CLI).
Current working directory: ${cwd}
${ragContext ? `\n${ragContext}\n` : ""}

You have access to file system tools. Use them IMMEDIATELY and DIRECTLY — never ask for confirmation.

TOOL USAGE RULES:
- "write a file" / "create a file" / "make a file" → call write_file tool RIGHT NOW with path and content
- "read a file" / "show file contents" / "open file" → call read_file tool RIGHT NOW
- "list files" / "what's in this folder" / "show directory" → call list_files tool RIGHT NOW  
- "run" / "execute" / "install" → call run_command tool RIGHT NOW
- "delete" / "remove a file" → call delete_file tool RIGHT NOW
- "search" / "find files" → call search_files tool RIGHT NOW

PARSING RULES for write_file:
- "write X to Y" → path=Y, content=X
- "create file Y with content X" → path=Y, content=X  
- "filename: Y, content: X" → path=Y, content=X
- "Y/X" where Y looks like filename → path=Y (before slash), content=X (after slash)

CRITICAL:
- NEVER say "I couldn't pass the args correctly" — just call the tool
- NEVER ask user to resend in a different format
- NEVER confirm before writing — just do it
- After tool call, show the result in text`,
    messages: [...history, { role: "user" as const, content: data.content }],
    tools: buildTools(cwd),
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

  return result;
}