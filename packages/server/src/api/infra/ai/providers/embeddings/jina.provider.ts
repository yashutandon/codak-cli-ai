/**
 * Jina AI Embedding Provider (Priority 2)
 *
 * Model: jina-embeddings-v3
 * Dimensions: 1024
 * API: https://api.jina.ai/v1/embeddings
 */

import type {
  EmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "../../interfaces/embedding-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const DEFAULT_MODEL = "jina-embeddings-v3";

interface JinaResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

export class JinaEmbeddingProvider implements EmbeddingProvider {
  readonly name = "jina";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 15_000,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  private async request(texts: string[]): Promise<JinaResponse> {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        task: "retrieval.passage",
        dimensions: 1024,
      }),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0) || undefined;
      throw new RateLimitError(this.name, retryAfter);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError(
        `[jina] HTTP ${response.status}: ${body}`,
        this.name,
        response.status,
        [500, 502, 503, 504].includes(response.status),
      );
    }

    return response.json() as Promise<JinaResponse>;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const result = await withTimeout(this.request([text]), this.timeoutMs, this.name);
    const embedding = result.data[0]?.embedding;
    if (!embedding) throw new ProviderError("Empty embedding response", this.name, 500, false);

    return {
      embedding,
      provider: this.name,
      tokenCount: result.usage.total_tokens,
    };
  }

  async embedMany(texts: string[]): Promise<BatchEmbeddingResult> {
    const result = await withTimeout(this.request(texts), this.timeoutMs, this.name);
    const sorted = [...result.data].sort((a, b) => a.index - b.index);

    return {
      embeddings: sorted.map((d) => d.embedding),
      provider: this.name,
      tokenCount: result.usage.total_tokens,
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
