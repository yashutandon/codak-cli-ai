/**
 * Groq LLM Provider
 *
 * Ultra-fast inference via Groq's LPU hardware.
 * Uses @ai-sdk/groq which is already installed.
 */

import { createGroq } from "@ai-sdk/groq";
import { generateText, streamText } from "ai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../../interfaces/llm-provider";
import { ProviderError } from "../../errors/provider.error";
import { withTimeout } from "../../utils/timeout";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class GroqLLMProvider implements LLMProvider {
  readonly name = "groq";
  private readonly client: ReturnType<typeof createGroq>;

  constructor(
    apiKey: string,
    private readonly timeoutMs: number = 30_000,
    private readonly defaultModel: string = DEFAULT_MODEL,
  ) {
    this.client = createGroq({ apiKey });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = options?.modelId ?? this.defaultModel;

    try {
      const { text, usage } = await withTimeout(
        generateText({
          model: this.client(model),
          system: options?.system,
          prompt,
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature,
        }),
        this.timeoutMs,
        this.name,
      );

      return {
        text,
        provider: this.name,
        model,
        promptTokens: usage?.inputTokens,
        completionTokens: usage?.outputTokens,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("429")) {
        throw new ProviderError(err.message, this.name, 429, true);
      }
      throw err;
    }
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    const model = options?.modelId ?? this.defaultModel;

    const result = streamText({
      model: this.client(model),
      system: options?.system,
      prompt,
      maxOutputTokens: options?.maxTokens,
      temperature: options?.temperature,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
