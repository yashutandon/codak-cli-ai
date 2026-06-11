import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { findSupportedChatModel } from "@codak/shared";
import { AppError } from "../../utils/AppError";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export function getModel(modelId: string) {
  const found = findSupportedChatModel(modelId) as
    | { id: string; provider: string }
    | undefined;
  if (!found) throw new AppError(`Unsupported model: ${modelId}`, 400);

  switch (found.provider) {
    case "anthropic": return anthropic(modelId as Parameters<typeof anthropic>[0]);
    case "google":    return google(modelId as Parameters<typeof google>[0]);
    case "groq":      return groq(modelId);
    case "openai":    return openai(modelId as Parameters<typeof openai>[0]);
    default:          throw new AppError(`Unsupported provider: ${found.provider}`, 400);
  }
}