/**
 * LLMProvider Interface
 *
 * Every LLM provider MUST implement this contract.
 * The gateway only depends on this interface — never on concrete classes.
 */

export interface GenerateOptions {
  /** System prompt */
  system?: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Temperature 0–1 */
  temperature?: number;
  /** Model ID override — provider interprets this */
  modelId?: string;
}

export interface GenerateResult {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
}

export interface LLMProvider {
  /** Unique provider identifier — must match ai.config.ts provider name */
  readonly name: string;

  /**
   * Generate a completion for the given prompt.
   * Throws ProviderError | TimeoutError | RateLimitError on failure.
   */
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

  /**
   * Stream a completion token-by-token.
   * Yields string chunks as they arrive.
   */
  stream(prompt: string, options?: GenerateOptions): AsyncIterable<string>;
}
