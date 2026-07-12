/**
 * Cohere Embedding Provider (Priority 3)
 *
 * Model: embed-english-v3.0
 * Dimensions: 1024
 * API: https://api.cohere.com/v1/embed
 */

import type {
  EmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "../../interfaces/embedding-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const COHERE_API_URL = "https://api.cohere.com/v1/embed";
const DEFAULT_MODEL = "embed-english-v3.0";

interface CohereResponse {
  embeddings: number[][];
  meta?: { billed_units?: { input_tokens?: number } };
}

export class CohereEmbeddingProvider implements EmbeddingProvider {
  readonly name = "cohere";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 15_000,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  private async request(texts: string[]): Promise<CohereResponse> {
    const response = await fetch(COHERE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Client-Name": "codak-ai-gateway",
      },
      body: JSON.stringify({
        model: this.model,
        texts,
        input_type: "search_document",
        embedding_types: ["float"],
      }),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0) || undefined;
      throw new RateLimitError(this.name, retryAfter);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError(
        `[cohere] HTTP ${response.status}: ${body}`,
        this.name,
        response.status,
        [500, 502, 503, 504].includes(response.status),
      );
    }

    return response.json() as Promise<CohereResponse>;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const result = await withTimeout(this.request([text]), this.timeoutMs, this.name);
    const embedding = result.embeddings[0];
    if (!embedding) throw new ProviderError("Empty embedding response", this.name, 500, false);

    return {
      embedding,
      provider: this.name,
      tokenCount: result.meta?.billed_units?.input_tokens,
    };
  }

  async embedMany(texts: string[]): Promise<BatchEmbeddingResult> {
    const result = await withTimeout(this.request(texts), this.timeoutMs, this.name);

    return {
      embeddings: result.embeddings,
      provider: this.name,
      tokenCount: result.meta?.billed_units?.input_tokens,
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
