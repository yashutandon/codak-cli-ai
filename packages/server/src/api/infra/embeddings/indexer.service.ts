import { redis } from "../redis/redis";
import { enqueueIndexCodebase, enqueueReindexFile } from "../queue/embedding.queue";

export type IndexingStatus = "pending" | "indexing" | "done" | "failed";

const STATUS_KEY = (sessionId: string) => `rag:status:${sessionId}`;
const STATUS_TTL_SECONDS = 60 * 60 * 24; // 24 hours — server restart pe bhi persist

/**
 * Get indexing status for a session from Redis.
 * Falls back to "pending" if key does not exist.
 */
export async function getIndexingStatus(sessionId: string): Promise<IndexingStatus> {
  const status = await redis.get(STATUS_KEY(sessionId));
  return (status as IndexingStatus | null) ?? "pending";
}

/**
 * Set indexing status in Redis.
 * Called by the worker when status changes.
 */
export async function setIndexingStatus(
  sessionId: string,
  status: IndexingStatus
): Promise<void> {
  await redis.set(STATUS_KEY(sessionId), status, "EX", STATUS_TTL_SECONDS);
}

/**
 * Enqueue a full codebase indexing job.
 * Sets status to "pending" immediately so callers can poll.
 * Actual work happens in the BullMQ worker (src/worker.ts).
 */
export async function indexCodebase(sessionId: string, cwd: string): Promise<void> {
  await setIndexingStatus(sessionId, "pending");
  await enqueueIndexCodebase(sessionId, cwd);
}

/**
 * Enqueue a single-file reindex job.
 * Actual work happens in the BullMQ worker (src/worker.ts).
 */
export async function triggerReindex(
  sessionId: string,
  filePath: string,
  cwd: string
): Promise<void> {
  await enqueueReindexFile(sessionId, filePath, cwd);
}