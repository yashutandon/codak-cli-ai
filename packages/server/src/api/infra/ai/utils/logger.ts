/**
 * Structured AI observability logger.
 *
 * Emits JSON lines to stdout — compatible with any log aggregator
 * (Datadog, CloudWatch, GCP Logging, etc.).
 */

export interface EmbedRequestLog {
  event: "embed";
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

export interface LLMRequestLog {
  event: "llm";
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

export type AIRequestLog = EmbedRequestLog | LLMRequestLog;

export const AILogger = {
  log(entry: AIRequestLog): void {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "ai-gateway",
      ...entry,
    });
    console.log(line);
  },

  error(context: string, err: unknown): void {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "ai-gateway",
        event: "error",
        context,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }),
    );
  },
};
