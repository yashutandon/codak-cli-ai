import fs from "fs/promises";
import { db } from "@codak/database";
import { RAG_CONFIG } from "../../config/rag";
import { chunkFile } from "./chunker.service";
import { getEmbeddingsBatch, sleep } from "./embedding.service";
import { scanFiles } from "./scanner.service";
import type { CodeChunkInput } from "./chunker.service";

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