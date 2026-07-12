/**
 * MetricsManager — Structured Observability for the AI Gateway
 *
 * Records timing and metadata for every gateway request.
 * Delegates to AILogger for output — swap the logger target without
 * changing any business logic.
 */

import { AILogger } from "../utils/logger";
import type { EmbedRequestLog, LLMRequestLog } from "../utils/logger";

export interface EmbedMetrics {
  provider: string;
  inputLength: number;
  latencyMs: number;
  retries: number;
  fallbacksUsed: string[];
  tokenCount?: number;
  costUsd?: number;
  cached: boolean;
  error?: string;
}

export interface LLMMetrics {
  provider: string;
  model: string;
  latencyMs: number;
  retries: number;
  fallbacksUsed: string[];
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  error?: string;
}

export class MetricsManager {
  recordEmbed(metrics: EmbedMetrics): void {
    const entry: EmbedRequestLog = {
      event: "embed",
      ...metrics,
    };
    AILogger.log(entry);
  }

  recordLLM(metrics: LLMMetrics): void {
    const entry: LLMRequestLog = {
      event: "llm",
      ...metrics,
    };
    AILogger.log(entry);
  }

  recordError(context: string, err: unknown): void {
    AILogger.error(context, err);
  }
}
