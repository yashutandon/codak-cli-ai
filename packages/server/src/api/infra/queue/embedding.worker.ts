import { Worker, type Job } from "bullmq";
import fs from "fs/promises";
import path, { resolve } from "path";
import { db } from "@codak/database";
import { RAG_CONFIG } from "../../config/rag";
import { chunkFile, type CodeChunkInput } from "../embeddings/chunker.service";
import { getEmbeddingsBatch, sleep } from "../embeddings/embedding.service";
import { scanFiles } from "../embeddings/scanner.service";
import { setIndexingStatus } from "../embeddings/indexer.service";
import type { EmbeddingJobData, EmbeddingJobName } from "./embedding.queue";
import { EMBEDDING_QUEUE_NAME } from "./embedding.queue";
import { createRedisConnection } from "../redis/redis";

/**
 * Process a full codebase indexing job.
 *
 * Rate limiting, retries, and provider fallback are handled transparently
 * by the AIGateway inside getEmbeddingsBatch(). The worker only needs to
 * handle BullMQ-level job failure (rethrow → BullMQ retries the entire job).
 */
async function processIndexCodebase(
  sessionId: string,
  cwd: string,
  signal: AbortSignal
): Promise<void> {
  await setIndexingStatus(sessionId, "indexing");

  try {
    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      console.warn(`[Worker:indexer] Session not found: ${sessionId}. Aborting indexing.`);
      await setIndexingStatus(sessionId, "failed");
      return;
    }

    await db.codeChunk.deleteMany({ where: { sessionId } });

    const files = await scanFiles(cwd);
    console.log(`[Worker:indexer] ${files.length} files found in ${cwd}`);

    const allChunks: CodeChunkInput[] = [];

    for (const file of files) {
      if (signal.aborted) throw new Error("Job aborted");
      try {
        const content = await fs.readFile(file.absolutePath, "utf-8");
        const chunks = chunkFile(content, file.relativePath);
        allChunks.push(...chunks);
      } catch (err) {
        console.error(`[Worker:indexer] Read failed: ${file.relativePath}`, err);
      }
    }

    console.log(`[Worker:indexer] Total chunks: ${allChunks.length}`);

    const { batchSize, delayBetweenBatchesMs } = RAG_CONFIG.rateLimit;

    let i = 0;
    while (i < allChunks.length) {
      if (signal.aborted) throw new Error("Job aborted");

      const batch = allChunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);

      // AIGateway handles retry (500ms → 1s → 2s) and provider fallback internally.
      // If it throws here, BullMQ will retry the entire job per queue defaultJobOptions.
      const embeddings = await getEmbeddingsBatch(texts);

      const insertValues = batch
        .map((chunk, j) => {
          const embedding = embeddings[j];
          if (!chunk || !embedding) return null;
          return { chunk, embedding };
        })
        .filter(Boolean) as { chunk: CodeChunkInput; embedding: number[] }[];

      for (const { chunk, embedding } of insertValues) {
        await db.$executeRaw`
          INSERT INTO "CodeChunk"
            ("id", "sessionId", "filePath", "content", "embedding", "startLine", "endLine", "createdAt")
          VALUES (
            gen_random_uuid()::text,
            ${sessionId},
            ${chunk.filePath},
            ${chunk.content},
            ${`[${embedding.join(",")}]`}::vector,
            ${chunk.startLine},
            ${chunk.endLine},
            NOW()
          )
          ON CONFLICT DO NOTHING
        `;
      }

      console.log(
        `[Worker:indexer] Batch ${Math.floor(i / batchSize) + 1} done (${i + batch.length}/${allChunks.length})`
      );

      i += batchSize;

      if (i < allChunks.length) {
        await sleep(delayBetweenBatchesMs);
      }
    }

    await setIndexingStatus(sessionId, "done");
    console.log(`[Worker:indexer] Indexing complete for session: ${sessionId}`);
  } catch (err) {
    await setIndexingStatus(sessionId, "failed");
    console.error(`[Worker:indexer] Fatal error:`, err);
    throw err; // Rethrow so BullMQ can retry the job
  }
}

/**
 * Process a single-file reindex job.
 */
async function processReindexFile(
  sessionId: string,
  filePath: string,
  cwd: string,
  signal: AbortSignal
): Promise<void> {
  try {
    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      console.warn(`[Worker:reindex] Session not found: ${sessionId}. Aborting.`);
      return;
    }

    const absolutePath = resolve(cwd, filePath.replace(/^\/+/, ""));
    let content: string;

    try {
      content = await fs.readFile(absolutePath, "utf-8");
    } catch {
      await db.codeChunk.deleteMany({ where: { sessionId, filePath } });
      console.log(`[Worker:reindex] Removed chunks for deleted file: ${filePath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!RAG_CONFIG.supportedExtensions.includes(ext as any)) return;

    const stat = await fs.stat(absolutePath);
    if (stat.size > RAG_CONFIG.maxFileSizeBytes) return;

    await db.codeChunk.deleteMany({ where: { sessionId, filePath } });

    const chunks = chunkFile(content, filePath);
    if (chunks.length === 0) return;

    const { batchSize, delayBetweenBatchesMs } = RAG_CONFIG.rateLimit;

    let i = 0;
    while (i < chunks.length) {
      if (signal.aborted) throw new Error("Job aborted");

      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c: CodeChunkInput) => c.content);

      // AIGateway handles retry + fallback — no manual 429 handling needed here.
      const embeddings = await getEmbeddingsBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        if (!chunk || !embedding) continue;

        await db.$executeRaw`
          INSERT INTO "CodeChunk"
            ("id", "sessionId", "filePath", "content", "embedding", "startLine", "endLine", "createdAt")
          VALUES (
            gen_random_uuid()::text,
            ${sessionId},
            ${chunk.filePath},
            ${chunk.content},
            ${`[${embedding.join(",")}]`}::vector,
            ${chunk.startLine},
            ${chunk.endLine},
            NOW()
          )
          ON CONFLICT DO NOTHING
        `;
      }

      i += batchSize;
      if (i < chunks.length) await sleep(delayBetweenBatchesMs);
    }

    console.log(`[Worker:reindex] Done: ${filePath} (${chunks.length} chunks)`);
  } catch (err) {
    console.error(`[Worker:reindex] Failed for ${filePath}:`, err);
    throw err;
  }
}

/**
 * Create and return the BullMQ embedding worker.
 * Call this from src/worker.ts — NOT from the main Express process.
 */
export function createEmbeddingWorker(): Worker<EmbeddingJobData, void, EmbeddingJobName> {
  const abortController = new AbortController();

  const worker = new Worker<EmbeddingJobData, void, EmbeddingJobName>(
    EMBEDDING_QUEUE_NAME,
    async (job: Job<EmbeddingJobData>) => {
      const { data } = job;

      if (data.type === "full") {
        await processIndexCodebase(data.sessionId, data.cwd, abortController.signal);
      } else if (data.type === "file") {
        await processReindexFile(data.sessionId, data.filePath, data.cwd, abortController.signal);
      } else {
        console.warn(`[Worker] Unknown job type:`, data);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
      lockDuration: 5 * 60 * 1000, // 5 minutes
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] ✅ Job completed: ${job.id} (${job.name})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] ❌ Job failed: ${job?.id} (${job?.name}):`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[Worker] ❌ Worker error:`, err);
  });

  return worker;
}
