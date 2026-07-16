/**
 * AIGateway — The Single Public Entrypoint for All AI Operations
 *
 * Usage (anywhere in the codebase):
 *
 *   const gateway = AIGateway.getInstance();
 *   const embedding = await gateway.embed("some code text");
 *   const response  = await gateway.generate("explain this function");
 *
 * No consumer ever knows which provider served the request.
 * Provider failures, retries, fallbacks, and caching are all transparent.
 *
 * Architecture:
 *   AIGateway
 *     └── EmbeddingProviderRouter
 *           ├── EmbeddingFallbackManager  (priority-ordered providers)
 *           ├── HealthManager             (circuit breaker)
 *           ├── RetryManager              (exponential backoff)
 *           ├── CacheManager              (Redis + in-flight dedup)
 *           └── MetricsManager            (structured JSON logs)
 *     └── LLMProviderRouter
 *           ├── LLMFallbackManager
 *           ├── HealthManager
 *           ├── RetryManager
 *           └── MetricsManager
 */

import { AI_CONFIG, type ProviderConfig } from "../../../config/ai.config";
import type { GenerateOptions } from "../interfaces/llm-provider";

// Embedding providers (priority order = Voyage → Jina → Cohere → HF → Gemini)
import { VoyageEmbeddingProvider } from "../providers/embeddings/voyage.provider";
import { JinaEmbeddingProvider } from "../providers/embeddings/jina.provider";
import { CohereEmbeddingProvider } from "../providers/embeddings/cohere.provider";
import { HuggingFaceEmbeddingProvider } from "../providers/embeddings/huggingface.provider";
import { GeminiEmbeddingProvider } from "../providers/embeddings/gemini.provider";

// LLM providers
import { GeminiLLMProvider } from "../providers/llm/gemini.provider";
import { OpenRouterLLMProvider } from "../providers/llm/openrouter.provider";
import { GroqLLMProvider } from "../providers/llm/groq.provider";
import { OpenAILLMProvider } from "../providers/llm/openai.provider";
import { HuggingFaceLLMProvider } from "../providers/llm/huggingface.provider";

// Gateway components
import { HealthManager } from "./health.manager";
import { RetryManager } from "./retry.manager";
import { MetricsManager } from "./metrics.manager";
import { CacheManager } from "./cache.manager";
import { EmbeddingFallbackManager, LLMFallbackManager } from "./fallback.manager";
import { EmbeddingProviderRouter, LLMProviderRouter } from "./provider.router";

// Redis client (shared with rest of infra)
import { redis } from "../../redis/redis";

import type { EmbeddingProvider } from "../interfaces/embedding-provider";
import type { LLMProvider } from "../interfaces/llm-provider";

export class AIGateway {
  private static instance: AIGateway;

  private readonly embeddingRouter: EmbeddingProviderRouter;
  private readonly llmRouter: LLMProviderRouter;

  private constructor() {
    const embeddingCfg = AI_CONFIG.embedding;
    const llmCfg = AI_CONFIG.llm;

    // ── Shared managers ──────────────────────────────────────────────────────
    const health = new HealthManager(embeddingCfg.unhealthyWindowMs);
    const retry = new RetryManager(embeddingCfg.retry);
    const metrics = new MetricsManager();
    const cache = new CacheManager(redis, embeddingCfg.cache);

    // ── Build embedding provider list (only enabled providers) ───────────────
    const embeddingProviders = this.buildEmbeddingProviders();

    if (embeddingProviders.length === 0) {
      console.warn(
        "[AIGateway] ⚠️  No embedding providers configured. " +
          "Set at least one of: VOYAGE_API_KEY, JINA_API_KEY, COHERE_API_KEY, " +
          "HF_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY",
      );
    } else {
      console.log(
        `[AIGateway] ✅ Embedding providers: [${embeddingProviders.map((p) => p.name).join(" → ")}]`,
      );
    }

    // ── Build LLM provider list (only enabled providers) ─────────────────────
    const llmProviders = this.buildLLMProviders();

    if (llmProviders.length === 0) {
      console.warn("[AIGateway] ⚠️  No LLM providers configured.");
    } else {
      console.log(
        `[AIGateway] ✅ LLM providers: [${llmProviders.map((p) => p.name).join(" → ")}]`,
      );
    }

    // ── Wire up routers ───────────────────────────────────────────────────────
    this.embeddingRouter = new EmbeddingProviderRouter(
      new EmbeddingFallbackManager(embeddingProviders, health),
      health,
      retry,
      cache,
      metrics,
    );

    this.llmRouter = new LLMProviderRouter(
      new LLMFallbackManager(llmProviders, health),
      health,
      new RetryManager(llmCfg.retry),
      metrics,
    );
  }

  /**
   * Returns the singleton AIGateway instance.
   * Constructed lazily on first call.
   */
  static getInstance(): AIGateway {
    if (!AIGateway.instance) {
      AIGateway.instance = new AIGateway();
    }
    return AIGateway.instance;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Embed a single text string. Returns a vector. */
  embed(text: string): Promise<number[]> {
    return this.embeddingRouter.embed(text);
  }

  /** Embed multiple texts. Returns a vector per input, in the same order. */
  embedMany(texts: string[]): Promise<number[][]> {
    return this.embeddingRouter.embedMany(texts);
  }

  /** Generate a text response (non-streaming). */
  generate(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.llmRouter.generate(prompt, options);
  }

  /** Stream a text response token-by-token. */
  stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    return this.llmRouter.stream(prompt, options);
  }

  // ── Private factory helpers ────────────────────────────────────────────────

  private buildEmbeddingProviders(): EmbeddingProvider[] {
    const cfg = AI_CONFIG.embedding.providers;
    const get = (name: string): ProviderConfig =>
      cfg.find((p: ProviderConfig) => p.name === name)!;

    const providerMap: Record<string, () => EmbeddingProvider> = {
      voyage: () => new VoyageEmbeddingProvider(get("voyage").apiKey!, get("voyage").timeoutMs),
      jina: () => new JinaEmbeddingProvider(get("jina").apiKey!, get("jina").timeoutMs),
      cohere: () => new CohereEmbeddingProvider(get("cohere").apiKey!, get("cohere").timeoutMs),
      huggingface: () =>
        new HuggingFaceEmbeddingProvider(get("huggingface").apiKey!, get("huggingface").timeoutMs),
      gemini: () => new GeminiEmbeddingProvider(get("gemini").apiKey!, get("gemini").timeoutMs),
    };

    return (cfg as ProviderConfig[])
      .filter((p: ProviderConfig) => p.enabled)
      .map((p: ProviderConfig) => providerMap[p.name]?.())
      .filter((p): p is EmbeddingProvider => p !== undefined);
  }

  private buildLLMProviders(): LLMProvider[] {
    const cfg = AI_CONFIG.llm.providers;
    const get = (name: string): ProviderConfig => cfg.find((p: ProviderConfig) => p.name === name)!;

    const providerMap: Record<string, () => LLMProvider> = {
      gemini: () => new GeminiLLMProvider(get("gemini").timeoutMs),
      openrouter: () => new OpenRouterLLMProvider(get("openrouter").apiKey!, get("openrouter").timeoutMs),
      groq: () => new GroqLLMProvider(get("groq").apiKey!, get("groq").timeoutMs),
      openai: () => new OpenAILLMProvider(get("openai").timeoutMs),
      huggingface: () => new HuggingFaceLLMProvider(get("huggingface").apiKey!, get("huggingface").timeoutMs),
    };

    return (cfg as ProviderConfig[])
      .filter((p: ProviderConfig) => p.enabled)
      .map((p: ProviderConfig) => providerMap[p.name]?.())
      .filter((p): p is LLMProvider => p !== undefined);
  }
}
