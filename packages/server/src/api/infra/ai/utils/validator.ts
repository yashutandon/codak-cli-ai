/**
 * Input validation utilities for the AI Gateway.
 */

/**
 * Validate that a text input is non-empty and within a reasonable size limit.
 * Throws if invalid — callers should catch this before hitting providers.
 */
export function validateEmbedInput(text: string, maxBytes = 500_000): void {
  if (!text || typeof text !== "string") {
    throw new TypeError("Embedding input must be a non-empty string");
  }
  const byteLength = Buffer.byteLength(text, "utf8");
  if (byteLength > maxBytes) {
    throw new RangeError(
      `Embedding input too large: ${byteLength} bytes (max ${maxBytes})`,
    );
  }
}

/**
 * Validate a batch of texts.
 * Empty arrays are allowed (caller decides if that's an error).
 */
export function validateEmbedBatch(texts: string[], maxBatchSize = 2048): void {
  if (!Array.isArray(texts)) {
    throw new TypeError("Batch input must be an array of strings");
  }
  if (texts.length > maxBatchSize) {
    throw new RangeError(
      `Batch too large: ${texts.length} items (max ${maxBatchSize})`,
    );
  }
  texts.forEach((t, i) => {
    if (!t || typeof t !== "string") {
      throw new TypeError(`Batch item at index ${i} must be a non-empty string`);
    }
  });
}
