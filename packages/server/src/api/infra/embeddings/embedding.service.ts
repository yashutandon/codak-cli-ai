/**
 * embedding.service.ts
 *
 * Public API is intentionally identical to the original.
 * All callers (embedding.worker.ts, rag.service.ts) work without changes.
 *
 * Internally delegates to AIGateway, which provides:
 *   - Provider waterfall (Voyage → Jina → Cohere → HuggingFace → Gemini)
 *   - Automatic retry (500ms → 1s → 2s on 429/5xx/timeout)
 *   - Circuit breaker (unhealthy providers skipped for 5 min)
 *   - Redis-backed embedding cache (SHA256-keyed, 24h TTL)
 *   - In-flight deduplication (concurrent identical texts share one call)
 *   - Structured observability (JSON logs per request)
 */

import { AIGateway } from "../ai";

/**
 * Embed a single text string.
 * Returns a 1024-dimensional vector (Voyage-compatible schema).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  return AIGateway.getInstance().embed(text);
}

/**
 * Embed multiple texts in one gateway call.
 * Order of returned vectors matches order of input texts.
 */
export async function getEmbeddingsBatch(
  texts: string[],
): Promise<number[][]> {
  return AIGateway.getInstance().embedMany(texts);
}

/** Pause execution for `ms` milliseconds. Used by workers for rate-limit backoff. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));