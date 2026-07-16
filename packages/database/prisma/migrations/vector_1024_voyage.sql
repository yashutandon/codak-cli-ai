-- Migration: vector_1024_voyage
-- Converts the CodeChunk.embedding column from vector(3072) to vector(1024)
-- to match Voyage AI (voyage-code-3) output dimensions.
--
-- ⚠️  WARNING: This drops all existing embeddings.
-- All sessions will be re-indexed on next use.
--
-- Run this directly on your database BEFORE starting the worker.

BEGIN;

-- 1. Drop existing embedding column (vector type cannot be altered in pgvector)
ALTER TABLE "CodeChunk" DROP COLUMN IF EXISTS "embedding";

-- 2. Re-create with 1024 dimensions (Voyage AI)
ALTER TABLE "CodeChunk" ADD COLUMN "embedding" vector(1024);

-- 3. Create HNSW index for efficient approximate nearest-neighbor search
-- (pgvector >= 0.5.0 required)
CREATE INDEX IF NOT EXISTS "CodeChunk_embedding_hnsw_idx"
  ON "CodeChunk"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;
