/**
 * TimeoutError — thrown when a provider request exceeds its configured timeout.
 */
export class TimeoutError extends Error {
  readonly provider: string;
  readonly timeoutMs: number;
  readonly isRetryable = true;

  constructor(provider: string, timeoutMs: number) {
    super(`[${provider}] Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.provider = provider;
    this.timeoutMs = timeoutMs;
  }
}
