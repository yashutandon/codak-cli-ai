import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@codak/database";
import { findSupportedChatModel, tools as toolDefinitions } from "@codak/shared";
import { AppError } from "../../../utils/AppError";
import { redis } from "../../infra";
import { executeTool } from "../../lib/tools";
import type { SendMessageDto } from "./message.dto"
import { openai } from "@ai-sdk/openai";;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const SESSION_CACHE_TTL = 60 * 5;

function getModel(modelId: string) {
  const found = findSupportedChatModel(modelId) as { id: string; provider: string; pricing: any } | undefined;
  if (!found) throw new AppError(`Unsupported model: ${modelId}`, 400);

  switch (found.provider) {
    case "anthropic":
      return anthropic(modelId as Parameters<typeof anthropic>[0]);
    case "google":
      return google(modelId as Parameters<typeof google>[0]);
    case "groq":
      return groq(modelId);
    case "openai":
      return openai(modelId as Parameters<typeof openai>[0]);
    default:
      throw new AppError(`Unsupported provider: ${found.provider}`, 400);
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
        orderBy: { createdAt: "desc" },
        take: 6,
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

function enrichUserMessage(content: string): string {
  const trimmed = content.trim();
  const looksLikeFile = /^[\w./\\-]+\.\w+$/.test(trimmed);
  const looksLikePath = /^[./\\]/.test(trimmed) || trimmed.includes("/");

  if (looksLikeFile || looksLikePath) {
    return `Read and show me the contents of: ${trimmed}`;
  }

  return content;
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  data: SendMessageDto
) {
  const session = await getSessionWithCache(sessionId, userId);
  if (!session) throw new AppError("Session not found", 404);

  const cwd = session.cwd ?? process.cwd();

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

  await invalidateSessionCache(sessionId, userId);

  const history = session.messages
    .reverse()
    .filter((m: any) => m.content?.trim())
    .map((m: any) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  const userContent = enrichUserMessage(data.content);

  const result = streamText({
    model: getModel(data.model),
    system: `You are Codak, an AI coding assistant in a CLI environment.
Current working directory: ${cwd}

STRICT RULES:
- For casual conversation, greetings, or questions about yourself: respond with TEXT ONLY, no tools.
- Use tools ONLY when user explicitly says: "read", "write", "list", "run", "create", "delete", "search" + a file/directory.
- Use MAXIMUM 2 tool calls per response, then write a text summary.
- NEVER use tools just to answer a general question.
- After using a tool, ALWAYS write a text response. NEVER finish without text.
- "package.json" or any filename alone means read that file ONCE, then explain contents in text.`,
    messages: [...history, { role: "user" as const, content: userContent }],
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