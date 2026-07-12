import { Queue } from "bullmq";
import { createRedisConnection } from "../redis/redis";

export const MESSAGE_QUEUE_NAME = "ai-messages";

export type MessageJobData = {
  jobId: string;
  sessionId: string;
  userId: string;
  content: string;
  model: string;
  mode: "BUILD" | "PLAN";
};

export const messageQueue = new Queue<MessageJobData>(MESSAGE_QUEUE_NAME, {
  connection: createRedisConnection() as any,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

messageQueue.on("error", (err) => {
  console.error("❌ Queue error:", err.message);
});