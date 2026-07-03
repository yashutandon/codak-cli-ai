import { db } from "@codak/database";
import { getEmbedding } from "./embedding.service";
import { RAG_CONFIG } from "../../config/rag";

interface RetrievedChunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * Hybrid search using Reciprocal Rank Fusion (RRF) of:
 * 1. Vector similarity search (semantic understanding)
 * 2. Full-text keyword search (exact symbol matching)
 *
 * RRF Score = Σ 1 / (k + rank_i) where k=60 (standard constant)
 */
export async function retrieveRelevantChunks(
  sessionId: string,
  query: string
): Promise<string> {
  const queryEmbedding = await getEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Escape query for full-text search: replace special chars and split to tokens
  const tsQuery = query
    .replace(/[^a-zA-Z0-9\s_]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" | ") || "''";

  const topK = RAG_CONFIG.topK * 2; // Fetch more candidates for re-ranking

  // Hybrid query with RRF fusion
  const chunks = await db.$queryRaw<RetrievedChunk[]>`
    WITH
    vector_ranked AS (
      SELECT
        "id",
        "filePath",
        "content",
        "startLine",
        "endLine",
        ROW_NUMBER() OVER (ORDER BY embedding <-> ${embeddingStr}::vector) AS rank
      FROM "CodeChunk"
      WHERE "sessionId" = ${sessionId}
      LIMIT ${topK}
    ),
    keyword_ranked AS (
      SELECT
        "id",
        "filePath",
        "content",
        "startLine",
        "endLine",
        ROW_NUMBER() OVER (
          ORDER BY ts_rank(to_tsvector('english', "content"), to_tsquery('english', ${tsQuery})) DESC
        ) AS rank
      FROM "CodeChunk"
      WHERE "sessionId" = ${sessionId}
        AND to_tsvector('english', "content") @@ to_tsquery('english', ${tsQuery})
      LIMIT ${topK}
    ),
    fused AS (
      SELECT
        COALESCE(v."id", k."id") AS id,
        COALESCE(v."filePath", k."filePath") AS "filePath",
        COALESCE(v."content", k."content") AS content,
        COALESCE(v."startLine", k."startLine") AS "startLine",
        COALESCE(v."endLine", k."endLine") AS "endLine",
        (COALESCE(1.0 / (60 + v.rank), 0) + COALESCE(1.0 / (60 + k.rank), 0)) AS rrf_score
      FROM vector_ranked v
      FULL OUTER JOIN keyword_ranked k ON v."id" = k."id"
    )
    SELECT "filePath", content, "startLine", "endLine"
    FROM fused
    ORDER BY rrf_score DESC
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