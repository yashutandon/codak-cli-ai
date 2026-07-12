/**
 * Voyage AI Embedding Provider (Priority 1)
 *
 * Model: voyage-code-3 (optimized for code)
 * Dimensions: 1024
 * API: https://api.voyageai.com/v1/embeddings
 *
 * NOTE: Requires vector(1024) column in PostgreSQL.
 * Run the migration in packages/database/prisma before enabling.
 */

import type {
  EmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "../../interfaces/embedding-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const DEFAULT_MODEL = "voyage-code-3";

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  readonly name = "voyage";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 15_000,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  private async request(texts: string[]): Promise<VoyageResponse> {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0) || undefined;
      throw new RateLimitError(this.name, retryAfter);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError(
        `[voyage] HTTP ${response.status}: ${body}`,
        this.name,
        response.status,
        [500, 502, 503, 504].includes(response.status),
      );
    }

    return response.json() as Promise<VoyageResponse>;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const result = await withTimeout(this.request([text]), this.timeoutMs, this.name);
    const embedding = result.data[0]?.embedding;
    if (!embedding) throw new ProviderError("Empty embedding response", this.name, 500, false);

    return {
      embedding,
      provider: this.name,
      tokenCount: result.usage.total_tokens,
      // Voyage pricing: ~$0.00006 per 1K tokens (voyage-code-3)
      costUsd: (result.usage.total_tokens / 1_000) * 0.00006,
    };
  }

  async embedMany(texts: string[]): Promise<BatchEmbeddingResult> {
    const result = await withTimeout(this.request(texts), this.timeoutMs, this.name);
    // Sort by index to guarantee order
    const sorted = [...result.data].sort((a, b) => a.index - b.index);

    return {
      embeddings: sorted.map((d) => d.embedding),
      provider: this.name,
      tokenCount: result.usage.total_tokens,
      costUsd: (result.usage.total_tokens / 1_000) * 0.00006,
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
