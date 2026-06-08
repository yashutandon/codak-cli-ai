import { google } from "@ai-sdk/google";
import { embedMany, embed } from "ai";
import { RAG_CONFIG } from "../../config/rag";

// Single embedding
export async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(RAG_CONFIG.embeddingModel),
    value: text,
  });
  return embedding;
}

// Batch embeddings
export async function getEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: google.embeddingModel(RAG_CONFIG.embeddingModel),
    values: texts,
  });
  return embeddings;
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));