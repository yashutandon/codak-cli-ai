/**
 * OpenRouter LLM Provider
 *
 * OpenRouter is an API aggregator that proxies OpenAI-compatible requests
 * to 100+ models (Claude, Llama, Mistral, etc.).
 *
 * API: https://openrouter.ai/api/v1
 */

import type { LLMProvider, GenerateOptions, GenerateResult } from "../../interfaces/llm-provider";
import { ProviderError } from "../../errors/provider.error";
import { RateLimitError } from "../../errors/rate-limit.error";
import { withTimeout } from "../../utils/timeout";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct";

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class OpenRouterLLMProvider implements LLMProvider {
  readonly name = "openrouter";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 60_000,
    private readonly defaultModel: string = DEFAULT_MODEL,
  ) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = options?.modelId ?? this.defaultModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.system) messages.push({ role: "system", content: options.system });
    messages.push({ role: "user", content: prompt });

    const res = await withTimeout(
      fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://codak.ai",
          "X-Title": "Codak AI Gateway",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens,
          temperature: options?.temperature,
        }),
      }),
      this.timeoutMs,
      this.name,
    );

    if (res.status === 429) throw new RateLimitError(this.name);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError(`[openrouter] HTTP ${res.status}: ${body}`, this.name, res.status, [500, 502, 503, 504].includes(res.status));
    }

    const data = (await res.json()) as OpenRouterResponse;
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

    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://codak.ai",
        "X-Title": "Codak AI Gateway",
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!res.ok || !res.body) throw new ProviderError(`[openrouter] stream failed`, this.name, res.status, false);

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
