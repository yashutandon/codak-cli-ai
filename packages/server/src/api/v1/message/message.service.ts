import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@codak/database";
import { findSupportedChatModel } from "@codak/shared";
import { AppError } from "../../../utils/AppError";
import { redis } from "../../infra";
import type { SendMessageDto } from "./message.dto";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const SESSION_CACHE_TTL = 60 * 5; // 5 minutes

function getModel(modelId: string) {
  const found = findSupportedChatModel(modelId);
  if (!found) throw new AppError(`Unsupported model: ${modelId}`, 400);

  switch (found.provider) {
    case "anthropic":
      return anthropic(modelId as Parameters<typeof anthropic>[0]);
    case "google":
      return google(modelId as Parameters<typeof google>[0]);
    case "groq":
      return groq(modelId);
    default:
      throw new AppError(`Unsupported provider: ${found.provider}`, 400);
  }
}

async function getSessionWithCache(sessionId: string, userId: string) {
  const cacheKey = `session:${sessionId}:${userId}`;

  // Try Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // DB fetch
  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 20,
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

export async function sendMessage(
  sessionId: string,
  userId: string,
  data: SendMessageDto
) {
  const session = await getSessionWithCache(sessionId, userId);

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // Save user message
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

  // Invalidate cache — new message added
  await invalidateSessionCache(sessionId, userId);

  const history = session.messages.map((m: any) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  const result = streamText({
    model: getModel(data.model),
    messages: [...history, { role: "user" as const, content: data.content }],
    onFinish: async ({ text }) => {
      await db.message.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: text,
          mode: data.mode,
          model: data.model,
          status: "COMPLETE",
          title: "",
        },
      });

      // Invalidate cache again after assistant message saved
      await invalidateSessionCache(sessionId, userId);
    },
  });

  return result;
}