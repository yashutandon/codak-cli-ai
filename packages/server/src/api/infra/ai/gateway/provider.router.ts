/**
 * ProviderRouter — The Heart of the AI Gateway
 *
 * Orchestrates the complete embedding request pipeline:
 *   1. Validate input
 *   2. Cache check (Redis)
 *   3. In-flight deduplication
 *   4. Try each available provider in priority order:
 *      a. withRetry (500ms → 1s → 2s backoff)
 *      b. On final failure: mark provider unhealthy, try next
 *   5. Emit structured metrics
 *   6. Cache successful result
 *
 * No consumer of this class ever names a provider.
 */

import type { EmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from "../interfaces/embedding-provider";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../interfaces/llm-provider";
import type { HealthManager } from "./health.manager";
import type { RetryManager } from "./retry.manager";
import type { CacheManager } from "./cache.manager";
import type { MetricsManager } from "./metrics.manager";
import type { EmbeddingFallbackManager, LLMFallbackManager } from "./fallback.manager";
import { validateEmbedInput, validateEmbedBatch } from "../utils/validator";

export class EmbeddingProviderRouter {
  constructor(
    private readonly fallback: EmbeddingFallbackManager,
    private readonly health: HealthManager,
    private readonly retry: RetryManager,
    private readonly cache: CacheManager,
    private readonly metrics: MetricsManager,
  ) {}

  async embed(text: string): Promise<number[]> {
    validateEmbedInput(text);

    // 1. Cache hit
    const cached = await this.cache.get(text);
    if (cached) {
      this.metrics.recordEmbed({
        provider: "cache",
        inputLength: text.length,
        latencyMs: 0,
        retries: 0,
        fallbacksUsed: [],
        cached: true,
      });
      return cached;
    }

    // 2. In-flight deduplication + provider waterfall
    return this.cache.getOrComputeInFlight(text, () => this.runEmbedWaterfall(text));
  }

  private async runEmbedWaterfall(text: string): Promise<number[]> {
    const providers = this.fallback.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error("[ProviderRouter] No healthy embedding providers available");
    }

    const fallbacksUsed: string[] = [];
    const startTotal = Date.now();

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]!;
      const isFirstProvider = i === 0;
      if (!isFirstProvider) fallbacksUsed.push(providers[i - 1]!.name);

      let retries = 0;
      const start = Date.now();

      try {
        const result = await this.retry.execute(
          () => provider.embed(text),
          `embed:${provider.name}`,
        );

        const latencyMs = Date.now() - start;
        this.health.markHealthy(provider.name);
        this.metrics.recordEmbed({
          provider: provider.name,
          inputLength: text.length,
          latencyMs,
          retries,
          fallbacksUsed,
          tokenCount: result.tokenCount,
          costUsd: result.costUsd,
          cached: false,
        });

        // Cache the result
        await this.cache.set(text, result.embedding);
        return result.embedding;
      } catch (err) {
        this.health.markUnhealthy(provider.name);
        this.metrics.recordEmbed({
          provider: provider.name,
          inputLength: text.length,
          latencyMs: Date.now() - start,
          retries,
          fallbacksUsed,
          cached: false,
          error: err instanceof Error ? err.message : String(err),
        });

        const isLast = i === providers.length - 1;
        if (isLast) throw err;

        console.warn(
          `[ProviderRouter] Provider "${provider.name}" failed — falling back to "${providers[i + 1]!.name}"`,
        );
      }
    }

    throw new Error("[ProviderRouter] All embedding providers exhausted");
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    validateEmbedBatch(texts);

    if (texts.length === 0) return [];

    const providers = this.fallback.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error("[ProviderRouter] No healthy embedding providers available");
    }

    const fallbacksUsed: string[] = [];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]!;
      if (i > 0) fallbacksUsed.push(providers[i - 1]!.name);

      const start = Date.now();

      try {
        const result: BatchEmbeddingResult = await this.retry.execute(
          () => provider.embedMany(texts),
          `embedMany:${provider.name}`,
        );

        this.health.markHealthy(provider.name);
        this.metrics.recordEmbed({
          provider: provider.name,
          inputLength: texts.reduce((sum, t) => sum + t.length, 0),
          latencyMs: Date.now() - start,
          retries: 0,
          fallbacksUsed,
          tokenCount: result.tokenCount,
          costUsd: result.costUsd,
          cached: false,
        });

        return result.embeddings;
      } catch (err) {
        this.health.markUnhealthy(provider.name);
        const isLast = i === providers.length - 1;
        if (isLast) throw err;

        console.warn(
          `[ProviderRouter] embedMany: Provider "${provider.name}" failed — falling back to "${providers[i + 1]!.name}"`,
        );
      }
    }

    throw new Error("[ProviderRouter] All embedding providers exhausted");
  }
}

export class LLMProviderRouter {
  constructor(
    private readonly fallback: LLMFallbackManager,
    private readonly health: HealthManager,
    private readonly retry: RetryManager,
    private readonly metrics: MetricsManager,
  ) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const providers = this.fallback.getAvailableProviders();
    if (providers.length === 0) throw new Error("[ProviderRouter] No healthy LLM providers available");

    const fallbacksUsed: string[] = [];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]!;
      if (i > 0) fallbacksUsed.push(providers[i - 1]!.name);

      const start = Date.now();

      try {
        const result: GenerateResult = await this.retry.execute(
          () => provider.generate(prompt, options),
          `generate:${provider.name}`,
        );

        this.health.markHealthy(provider.name);
        this.metrics.recordLLM({
          provider: provider.name,
          model: result.model,
          latencyMs: Date.now() - start,
          retries: 0,
          fallbacksUsed,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          costUsd: result.costUsd,
        });

        return result.text;
      } catch (err) {
        this.health.markUnhealthy(provider.name);
        const isLast = i === providers.length - 1;
        if (isLast) throw err;
      }
    }

    throw new Error("[ProviderRouter] All LLM providers exhausted");
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    const providers = this.fallback.getAvailableProviders();
    if (providers.length === 0) throw new Error("[ProviderRouter] No healthy LLM providers available");

    // Stream from first available provider — no fallback mid-stream
    const provider = providers[0]!;
    yield* provider.stream(prompt, options);
  }
}
