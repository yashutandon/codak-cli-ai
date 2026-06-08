import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { RAG_CONFIG } from "../../config/rag";
export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
}

export async function scanFiles(cwd: string): Promise<ScannedFile[]> {
  const ignorePatterns = [
    ...RAG_CONFIG.ignoredDirs.map((d) => `**/${d}/**`),
    ...RAG_CONFIG.ignoredFiles,
  ];

  const files = await glob("**/*", {
    cwd,
    nodir: true,
    ignore: ignorePatterns,
    dot: false,
  });

  const scanned: ScannedFile[] = [];

  for (const relativePath of files) {
    const ext = path.extname(relativePath).toLowerCase();
    if (!RAG_CONFIG.supportedExtensions.includes(ext as any)) continue;

    const absolutePath = path.join(cwd, relativePath);

    try {
      const stat = await fs.stat(absolutePath);
      if (stat.size > RAG_CONFIG.maxFileSizeBytes) {
        console.warn(`[RAG:scanner] Skipping large file: ${relativePath} (${(stat.size / 1024).toFixed(1)}KB)`);
        continue;
      }
      scanned.push({ absolutePath, relativePath, sizeBytes: stat.size });
    } catch {
      // file read nahi hua — skip
    }
  }

  return scanned;
}