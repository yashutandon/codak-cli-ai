import { db } from "@codak/database";
import { getEmbedding } from "./embedding.service";
import { RAG_CONFIG } from "../../config/rag";
interface RetrievedChunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

export async function retrieveRelevantChunks(
  sessionId: string,
  query: string
): Promise<string> {
  const queryEmbedding = await getEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const chunks = await db.$queryRaw<RetrievedChunk[]>`
    SELECT
      "filePath",
      "content",
      "startLine",
      "endLine"
    FROM "CodeChunk"
    WHERE "sessionId" = ${sessionId}
    ORDER BY embedding <-> ${embeddingStr}::vector
    LIMIT ${RAG_CONFIG.topK}
  `;

  if (chunks.length === 0) return "";

  const context = chunks
    .map(
      (c) =>
        `// ${c.filePath} (lines ${c.startLine}–${c.endLine})\n${c.content}`
    )
    .join("\n\n---\n\n");

  return `<codebase_context>\n${context}\n</codebase_context>`;
}