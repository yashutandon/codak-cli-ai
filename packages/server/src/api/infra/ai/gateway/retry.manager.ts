/**
 * RetryManager — Exponential Backoff Retry Orchestrator
 *
 * Wraps the shared withRetry utility with gateway-level config.
 * Provides a typed execute() method consumed by ProviderRouter.
 */

import { withRetry } from "../utils/retry";
import type { RetryConfig } from "../utils/retry";

export class RetryManager {
  constructor(private readonly config: RetryConfig) {}

  /**
   * Execute fn with retry. Throws on final failure.
   * The caller (ProviderRouter) catches and switches providers.
   */
  execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    return withRetry(fn, this.config, context);
  }
}
