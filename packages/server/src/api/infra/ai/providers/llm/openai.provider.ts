/**
 * OpenAI LLM Provider
 *
 * Uses @ai-sdk/openai which is already installed.
 */

import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../../interfaces/llm-provider";
import { ProviderError } from "../../errors/provider.error";
import { withTimeout } from "../../utils/timeout";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";

  constructor(
    private readonly timeoutMs: number = 60_000,
    private readonly defaultModel: string = DEFAULT_MODEL,
  ) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = (options?.modelId ?? this.defaultModel) as Parameters<typeof openai>[0];

    try {
      const { text, usage } = await withTimeout(
        generateText({
          model: openai(model),
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
    const model = (options?.modelId ?? this.defaultModel) as Parameters<typeof openai>[0];

    const result = streamText({
      model: openai(model),
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
