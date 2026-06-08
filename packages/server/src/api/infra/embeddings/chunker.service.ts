import { RAG_CONFIG } from "../../config/rag";

export interface CodeChunkInput {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

export function chunkFile(
  content: string,
  filePath: string
): CodeChunkInput[] {
  const lines = content.split("\n");
  const chunks: CodeChunkInput[] = [];
  const { chunkSize, chunkOverlap } = RAG_CONFIG;
  const step = chunkSize - chunkOverlap;

  for (let i = 0; i < lines.length; i += step) {
    const startLine = i;
    const endLine = Math.min(i + chunkSize, lines.length);
    const chunkContent = lines.slice(startLine, endLine).join("\n").trim();

    if (chunkContent.length > 0) {
      chunks.push({
        filePath,
        content: chunkContent,
        startLine,
        endLine,
      });
    }

    if (endLine >= lines.length) break;
  }

  return chunks;
}