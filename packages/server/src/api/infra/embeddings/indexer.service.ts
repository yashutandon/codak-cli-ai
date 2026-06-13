import fs from "fs/promises";
import { db } from "@codak/database";
import { RAG_CONFIG } from "../../config/rag";
import { chunkFile } from "./chunker.service";
import { getEmbeddingsBatch, sleep } from "./embedding.service";
import { scanFiles } from "./scanner.service";
import type { CodeChunkInput } from "./chunker.service";
import path, { resolve } from "path";

export type IndexingStatus = "pending" | "indexing" | "done" | "failed";

const indexingStatusMap = new Map<string, IndexingStatus>();

export function getIndexingStatus(sessionId: string): IndexingStatus {
  return indexingStatusMap.get(sessionId) ?? "pending";
}

function isRateLimitError(err: any): boolean {
  return (
    err?.errors?.[0]?.statusCode === 429 ||
    err?.lastError?.statusCode === 429 ||
    err?.statusCode === 429
  );
}

export async function indexCodebase(
  sessionId: string,
  cwd: string
): Promise<void> {
  indexingStatusMap.set(sessionId, "indexing");

  try {
    await db.codeChunk.deleteMany({ where: { sessionId } });

    const files = await scanFiles(cwd);
    console.log(`[RAG:indexer] ${files.length} files found in ${cwd}`);

    const allChunks: CodeChunkInput[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file.absolutePath, "utf-8");
        const chunks = chunkFile(content, file.relativePath);
        allChunks.push(...chunks);
      } catch (err) {
        console.error(`[RAG:indexer] Read failed: ${file.relativePath}`, err);
      }
    }

    console.log(`[RAG:indexer] Total chunks: ${allChunks.length}`);

    const { batchSize, delayBetweenBatchesMs, retryDelayMs } = RAG_CONFIG.rateLimit;

    let i = 0;
    while (i < allChunks.length) {
      const batch = allChunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);

      try {
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
          `;
        }

        console.log(
          `[RAG:indexer] Batch ${Math.floor(i / batchSize) + 1} done (${i + batch.length}/${allChunks.length})`
        );

        i += batchSize;

        if (i < allChunks.length) {
          await sleep(delayBetweenBatchesMs);
        }
      } catch (err) {
        if (isRateLimitError(err)) {
          console.warn(
            `[RAG:indexer] Rate limited at chunk ${i} — waiting ${retryDelayMs / 1000}s...`
          );
          await sleep(retryDelayMs);
          // Same batch retry — i nahi badhao
        } else {
          console.error(`[RAG:indexer] Batch failed at index ${i}:`, err);
          i += batchSize; // Skip failed batch
        }
      }
    }

    indexingStatusMap.set(sessionId, "done");
    console.log(`[RAG:indexer] Indexing complete for session: ${sessionId}`);
  } catch (err) {
    indexingStatusMap.set(sessionId, "failed");
    console.error(`[RAG:indexer] Fatal error:`, err);
  }
}

export async function triggerReindex(
  sessionId: string,
  filePath: string,
  cwd: string
): Promise<void> {
  try {
    const absolutePath = resolve(cwd, filePath.replace(/^\/+/, ""));
    let content: string;

    try {
      content = await fs.readFile(absolutePath, "utf-8");
    } catch {
      // File delete ho gayi — chunks remove karo
      await db.codeChunk.deleteMany({ where: { sessionId, filePath } });
      console.log(`[RAG:reindex] Removed chunks for deleted file: ${filePath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!RAG_CONFIG.supportedExtensions.includes(ext as any)) return;

    const stat = await fs.stat(absolutePath);
    if (stat.size > RAG_CONFIG.maxFileSizeBytes) return;

    // Purane chunks hata do
    await db.codeChunk.deleteMany({ where: { sessionId, filePath } });

    const chunks = chunkFile(content, filePath);
    if (chunks.length === 0) return;

    const { batchSize, delayBetweenBatchesMs, retryDelayMs } = RAG_CONFIG.rateLimit;

    let i = 0;
    while (i < chunks.length) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);

      try {
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
          `;
        }

        i += batchSize;
        if (i < chunks.length) await sleep(delayBetweenBatchesMs);
      } catch (err) {
        if (isRateLimitError(err)) {
          console.warn(`[RAG:reindex] Rate limited — waiting ${retryDelayMs / 1000}s...`);
          await sleep(retryDelayMs);
        } else {
          console.error(`[RAG:reindex] Batch failed:`, err);
          i += batchSize;
        }
      }
    }

    console.log(`[RAG:reindex] Done: ${filePath} (${chunks.length} chunks)`);
  } catch (err) {
    console.error(`[RAG:reindex] Failed for ${filePath}:`, err);
  }
}