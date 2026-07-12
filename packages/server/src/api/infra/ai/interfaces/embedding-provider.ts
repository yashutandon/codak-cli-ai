/**
 * EmbeddingProvider Interface
 *
 * Every embedding provider MUST implement this contract.
 * The gateway only depends on this interface — never on concrete classes.
 */

export interface EmbeddingResult {
  /** The raw embedding vector */
  embedding: number[];
  /** Provider that served this result */
  provider: string;
  /** Token count if available */
  tokenCount?: number;
  /** Estimated cost in USD if available */
  costUsd?: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  provider: string;
  tokenCount?: number;
  costUsd?: number;
}

export interface EmbeddingProvider {
  /** Unique provider identifier — must match ai.config.ts provider name */
  readonly name: string;

  /**
   * Embed a single text string.
   * Throws ProviderError | TimeoutError | RateLimitError on failure.
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * Embed multiple texts in a single API call where supported,
   * or batched internally. Preserves input order.
   */
  embedMany(texts: string[]): Promise<BatchEmbeddingResult>;

  /**
   * Lightweight probe to check if the provider is reachable.
   * Should return true/false — never throw.
   */
  healthCheck(): Promise<boolean>;
}
