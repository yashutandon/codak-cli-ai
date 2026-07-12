import { ProviderError } from "../errors/provider.error";
import { RateLimitError } from "../errors/rate-limit.error";
import { TimeoutError } from "../errors/timeout.error";

export interface RetryConfig {
  maxAttempts: number;
  delays: readonly number[];
  retryableStatusCodes: readonly number[];
}

function isRetryable(err: unknown, retryableStatusCodes: readonly number[]): boolean {
  if (err instanceof TimeoutError) return true;
  if (err instanceof RateLimitError) return true;
  if (err instanceof ProviderError) {
    return retryableStatusCodes.includes(err.statusCode) || err.isRetryable;
  }
  // Network-level errors (fetch failures, ECONNRESET, etc.)
  if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network"))) {
    return true;
  }
  return false;
}

/**
 * Execute `fn` with exponential-backoff retry.
 *
 * Retry on: 429, 500, 502, 503, 504, TimeoutError, network failures.
 * Delays: config.delays[0] → config.delays[1] → config.delays[2] (default: 500ms, 1s, 2s).
 *
 * If all attempts fail, throws the last error so the caller can switch providers.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  context: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isRetryable(err, config.retryableStatusCodes)) {
        throw err; // Non-retryable — fail immediately
      }

      const isLastAttempt = attempt === config.maxAttempts - 1;
      if (isLastAttempt) break;

      const delayMs = config.delays[attempt] ?? config.delays[config.delays.length - 1]!;

      console.warn(
        `[Retry][${context}] Attempt ${attempt + 1}/${config.maxAttempts} failed — retrying in ${delayMs}ms`,
        { error: err instanceof Error ? err.message : String(err) },
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
