/**
 * AI Infrastructure Barrel Export
 *
 * Everything AI-related flows through this index.
 * External code imports from here — never from sub-paths.
 *
 * @example
 *   import { AIGateway } from '../infra/ai';
 */

// Main gateway (the only thing 99% of code needs)
export { AIGateway } from "./gateway/ai.gateway";

// Interfaces (for typing in service layers)
export type { EmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from "./interfaces/embedding-provider";
export type { LLMProvider, GenerateOptions, GenerateResult } from "./interfaces/llm-provider";

// Errors (for error handling in services)
export { ProviderError } from "./errors/provider.error";
export { TimeoutError } from "./errors/timeout.error";
export { RateLimitError } from "./errors/rate-limit.error";

// Health snapshot (for /health endpoints)
export type { ProviderHealth } from "./gateway/health.manager";
export { HealthManager } from "./gateway/health.manager";
