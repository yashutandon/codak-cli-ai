import { Queue } from "bullmq";
import { createRedisConnection } from "../redis/redis";

export interface IndexCodebaseJobData {
  type: "full";
  sessionId: string;
  cwd: string;
}

export interface ReindexFileJobData {
  type: "file";
  sessionId: string;
  filePath: string;
  cwd: string;
}

export type EmbeddingJobData = IndexCodebaseJobData | ReindexFileJobData;
export type EmbeddingJobName = "indexCodebase" | "reindexFile";

export const EMBEDDING_QUEUE_NAME = "embedding";

/**
 * BullMQ Queue for embedding jobs.
 * Jobs are processed by the worker in src/worker.ts.
 */
export const embeddingQueue = new Queue<EmbeddingJobData, void, EmbeddingJobName>(EMBEDDING_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Enqueue a full codebase indexing job.
 * Deduplication: same sessionId ke liye ek hi job at a time.
 */
export async function enqueueIndexCodebase(
  sessionId: string,
  cwd: string
): Promise<void> {
  const jobId = `index-${sessionId}`;
  await embeddingQueue.add(
    "indexCodebase" as EmbeddingJobName,
    { type: "full", sessionId, cwd },
    {
      jobId,
      removeOnComplete: true,
    }
  );
  console.log(`[Queue] Enqueued indexCodebase job for session: ${sessionId}`);
}

/**
 * Enqueue a single-file reindex job.
 */
export async function enqueueReindexFile(
  sessionId: string,
  filePath: string,
  cwd: string
): Promise<void> {
  const jobId = `reindex-${sessionId}-${filePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
  await embeddingQueue.add(
    "reindexFile" as EmbeddingJobName,
    { type: "file", sessionId, filePath, cwd },
    { jobId }
  );
  console.log(`[Queue] Enqueued reindexFile job: ${filePath}`);
}
