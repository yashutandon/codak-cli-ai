import { createHash } from "crypto";

/**
 * Compute a deterministic SHA-256 hex digest of any string.
 * Used as cache keys for embeddings.
 *
 * @example sha256("hello world") → "b94d27b99..."
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
