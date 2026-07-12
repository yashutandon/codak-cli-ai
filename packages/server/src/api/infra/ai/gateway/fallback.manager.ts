/**
 * FallbackManager — Provider Waterfall Strategy
 *
 * Holds the ordered list of embedding providers.
 * Filters out disabled and unhealthy providers before routing.
 * Provides the waterfall sequence for ProviderRouter.
 */

import type { EmbeddingProvider } from "../interfaces/embedding-provider";
import type { LLMProvider } from "../interfaces/llm-provider";
import type { HealthManager } from "./health.manager";

export class EmbeddingFallbackManager {
  constructor(
    private readonly providers: readonly EmbeddingProvider[],
    private readonly health: HealthManager,
  ) {}

  /**
   * Returns providers in priority order, filtering unhealthy ones.
   * Always returns at least an empty array — callers must handle that.
   */
  getAvailableProviders(): EmbeddingProvider[] {
    return this.providers.filter((p) => this.health.isHealthy(p.name));
  }

  /** All providers regardless of health — for diagnostics */
  getAllProviders(): readonly EmbeddingProvider[] {
    return this.providers;
  }
}

export class LLMFallbackManager {
  constructor(
    private readonly providers: readonly LLMProvider[],
    private readonly health: HealthManager,
  ) {}

  getAvailableProviders(): LLMProvider[] {
    return this.providers.filter((p) => this.health.isHealthy(p.name));
  }

  getAllProviders(): readonly LLMProvider[] {
    return this.providers;
  }
}
