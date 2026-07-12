/**
 * Gemini LLM Provider
 *
 * Uses @ai-sdk/google under the hood since it's already installed.
 * Delegates stream/generate to the Vercel AI SDK.
 */

import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../../interfaces/llm-provider";
import { ProviderError } from "../../errors/provider.error";
import { withTimeout } from "../../utils/timeout";

const DEFAULT_MODEL = "gemini-2.0-flash";

export class GeminiLLMProvider implements LLMProvider {
  readonly name = "gemini";

  constructor(
    private readonly timeoutMs: number = 60_000,
    private readonly defaultModel: string = DEFAULT_MODEL,
  ) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const modelId = (options?.modelId ?? this.defaultModel) as Parameters<typeof google>[0];

    try {
      const { text, usage } = await withTimeout(
        generateText({
          model: google(modelId),
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
        model: modelId,
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
    const modelId = (options?.modelId ?? this.defaultModel) as Parameters<typeof google>[0];

    const result = streamText({
      model: google(modelId),
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
