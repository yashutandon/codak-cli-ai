import { Worker } from "bullmq";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@codak/database";
import { findSupportedChatModel, type ChatStreamEvent } from "@codak/shared";
import { createRedisConnection } from "../redis/redis";
import { sseManager } from "./sse-manager";
import { MESSAGE_QUEUE_NAME, type MessageJobData } from "./message.queue";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function getModel(modelId: string) {
  const found = findSupportedChatModel(modelId);
  if (!found) throw new Error(`Unsupported model: ${modelId}`);

  switch (found.provider) {
    case "anthropic":
      return anthropic(modelId as Parameters<typeof anthropic>[0]);
    case "google":
      return google(modelId as Parameters<typeof google>[0]);
    case "groq":
      return groq(modelId);
    default:
      throw new Error(`Unsupported provider: ${found.provider}`);
  }
}

function sendEvent(jobId: string, event: ChatStreamEvent) {
  sseManager.send(jobId, event);
}

export function startMessageWorker() {
  const worker = new Worker<MessageJobData>(
    MESSAGE_QUEUE_NAME,
    async (job) => {
      const { jobId, sessionId, userId, content, model, mode } = job.data;
      const startTime = Date.now();

      const session = await db.session.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      });

      if (!session) {
        sendEvent(jobId, { type: "error", message: "Session not found" });
        return;
      }

      const history = session.messages.map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const last = history[history.length - 1];
      const messages =
        last?.role === "user" && last?.content === content
          ? history
          : [...history, { role: "user" as const, content }];

      let accumulated = "";

      try {
        const result = streamText({
          model: getModel(model),
          messages,
        });

        for await (const chunk of result.textStream) {
          accumulated += chunk;
          sendEvent(jobId, { type: "text-delta", text: chunk });
        }

        const saved = await db.message.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: accumulated,
            title: "",
            status: "COMPLETE",
            mode: mode as "BUILD" | "PLAN",
            model,
            duration: Date.now() - startTime,
          },
        });

        sendEvent(jobId, {
          type: "done",
          messageId: saved.id,
          durationMs: Date.now() - startTime,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI error";
        sendEvent(jobId, { type: "error", message });
        throw err;
      }
    },
    {
      connection: createRedisConnection() as any,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    if (job?.data.jobId) {
      sendEvent(job.data.jobId, { type: "error", message: "Job failed after retries" });
    }
  });

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  console.log("🔧 Message worker started");
  return worker;
}