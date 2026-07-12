/**
 * HuggingFace Inference API Embedding Provider (Priority 4)
 *
 * Model: BAAI/bge-small-en-v1.5 (384-dim, free tier)
 * Fallback to any HF feature-extraction model.
 * API: https://api-inference.huggingface.co/pipeline/feature-extraction/{model}
 *
 * NOTE: HF free tier has a 20s timeout and throttling.
 */

import type {
  EmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "../../interfaces/embedding-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const HF_API_BASE = "https://api-inference.huggingface.co/pipeline/feature-extraction";
const DEFAULT_MODEL = "BAAI/bge-small-en-v1.5";

export class HuggingFaceEmbeddingProvider implements EmbeddingProvider {
  readonly name = "huggingface";
  private readonly apiUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 20_000,
    model: string = DEFAULT_MODEL,
  ) {
    this.apiUrl = `${HF_API_BASE}/${model}`;
  }

  private async request(inputs: string[]): Promise<number[][]> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ inputs, options: { wait_for_model: true } }),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0) || undefined;
      throw new RateLimitError(this.name, retryAfter);
    }

    if (response.status === 503) {
      // HF model loading — retryable
      throw new ProviderError(
        `[huggingface] Model loading (503)`,
        this.name,
        503,
        true,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError(
        `[huggingface] HTTP ${response.status}: ${body}`,
        this.name,
        response.status,
        [500, 502, 503, 504].includes(response.status),
      );
    }

    // HF returns either number[][] or number[] (single input)
    const raw: unknown = await response.json();
    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      return raw as number[][];
    }
    // Single input — wrap
    return [raw as number[]];
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const result = await withTimeout(this.request([text]), this.timeoutMs, this.name);
    const embedding = result[0];
    if (!embedding) throw new ProviderError("Empty embedding response", this.name, 500, false);

    return { embedding, provider: this.name };
  }

  async embedMany(texts: string[]): Promise<BatchEmbeddingResult> {
    const result = await withTimeout(this.request(texts), this.timeoutMs, this.name);
    return { embeddings: result, provider: this.name };
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
