/**
 * Gemini Embedding Provider (Priority 5 — last fallback)
 *
 * Model: gemini-embedding-001
 * Dimensions: 3072 (original schema) or configurable
 * API: Google Generative AI REST
 *
 * Uses native fetch — no @ai-sdk/google dependency in this layer.
 */

import type {
  EmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "../../interfaces/embedding-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "models/gemini-embedding-001";

interface GeminiEmbedResponse {
  embedding: { values: number[] };
}

interface GeminiBatchEmbedResponse {
  embeddings: Array<{ values: number[] }>;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 15_000,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  private buildUrl(endpoint: string): string {
    return `${GEMINI_API_BASE}/${this.model}:${endpoint}?key=${this.apiKey}`;
  }

  private handleErrorResponse(status: number, body: string): never {
    if (status === 429) throw new RateLimitError(this.name);
    throw new ProviderError(
      `[gemini] HTTP ${status}: ${body}`,
      this.name,
      status,
      [500, 502, 503, 504].includes(status),
    );
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const res = await withTimeout(
      fetch(this.buildUrl("embedContent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          content: { parts: [{ text }] },
        }),
      }),
      this.timeoutMs,
      this.name,
    );

    if (!res.ok) {
      this.handleErrorResponse(res.status, await res.text().catch(() => ""));
    }

    const data = (await res.json()) as GeminiEmbedResponse;
    return {
      embedding: data.embedding.values,
      provider: this.name,
    };
  }

  async embedMany(texts: string[]): Promise<BatchEmbeddingResult> {
    // Gemini batchEmbedContents endpoint
    const res = await withTimeout(
      fetch(this.buildUrl("batchEmbedContents"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: this.model,
            content: { parts: [{ text }] },
          })),
        }),
      }),
      this.timeoutMs,
      this.name,
    );

    if (!res.ok) {
      this.handleErrorResponse(res.status, await res.text().catch(() => ""));
    }

    const data = (await res.json()) as GeminiBatchEmbedResponse;
    return {
      embeddings: data.embeddings.map((e) => e.values),
      provider: this.name,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.embed("health");
      return true;
    } catch {
      return false;
    }
  }
}
