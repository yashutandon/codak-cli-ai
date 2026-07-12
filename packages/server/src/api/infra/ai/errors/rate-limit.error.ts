/**
 * RateLimitError — thrown on HTTP 429 responses.
 * Carries retry-after hint if the provider supplies it.
 */
export class RateLimitError extends Error {
  readonly provider: string;
  readonly statusCode = 429;
  readonly isRetryable = true;
  /** Seconds until the provider allows new requests, if known */
  readonly retryAfterSeconds?: number;

  constructor(provider: string, retryAfterSeconds?: number) {
    super(
      `[${provider}] Rate limited${retryAfterSeconds ? ` — retry after ${retryAfterSeconds}s` : ""}`,
    );
    this.name = "RateLimitError";
    this.provider = provider;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
