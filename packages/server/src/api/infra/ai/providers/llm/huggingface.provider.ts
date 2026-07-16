/**
 * HuggingFace LLM Provider
 *
 * Uses the HuggingFace Inference API (Serverless) via the OpenAI-compatible endpoint.
 */

import type { LLMProvider, GenerateOptions, GenerateResult } from "../../interfaces/llm-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const DEFAULT_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

interface HFResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class HuggingFaceLLMProvider implements LLMProvider {
  readonly name = "huggingface";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 60_000,
    private readonly defaultModel: string = DEFAULT_MODEL,
  ) {}

  private getUrl(model: string): string {
    return `https://api-inference.huggingface.co/v1/chat/completions`;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = options?.modelId ?? this.defaultModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.system) messages.push({ role: "system", content: options.system });
    messages.push({ role: "user", content: prompt });

    const res = await withTimeout(
      fetch(this.getUrl(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        }),
      }),
      this.timeoutMs,
      this.name,
    );

    if (res.status === 429) throw new RateLimitError(this.name);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(`[huggingface] HTTP ${res.status}: ${body}`, this.name, res.status, [500, 502, 503, 504].includes(res.status));
    }

    const data = (await res.json()) as HFResponse;
    return {
      text: data.choices[0]?.message.content ?? "",
      provider: this.name,
      model,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    const model = options?.modelId ?? this.defaultModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.system) messages.push({ role: "system", content: options.system });
    messages.push({ role: "user", content: prompt });

    const res = await fetch(this.getUrl(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(`[huggingface] stream failed HTTP ${res.status}: ${body}`, this.name, res.status, false);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const json = line.slice(6).trim();
        if (json === "[DONE]") return;
        try {
          const parsed = JSON.parse(json);
          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  }
}
