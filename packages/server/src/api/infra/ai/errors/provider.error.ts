/**
 * ProviderError — base class for all AI provider errors.
 * Carries the provider name and HTTP status code for routing decisions.
 */
export class ProviderError extends Error {
  readonly provider: string;
  readonly statusCode: number;
  readonly isRetryable: boolean;

  constructor(
    message: string,
    provider: string,
    statusCode: number,
    isRetryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}
