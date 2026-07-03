import { readFile, stat } from "fs/promises";
import { resolve } from "path";

const MAX_READ_SIZE = 500 * 1024; // 500KB — large enough for any source file

export async function readFileTool(
  params: { path: string },
  cwd: string
): Promise<string> {
  const safePath = params.path.replace(/^\/+/, "");
  const fullPath = resolve(cwd, safePath);

  try {
    // Check size before reading to avoid loading huge binaries
    const fileStat = await stat(fullPath);
    if (fileStat.size > MAX_READ_SIZE) {
      throw new Error(
        `File too large to read (${(fileStat.size / 1024).toFixed(0)}KB > 500KB limit): ${params.path}`
      );
    }

    const content = await readFile(fullPath, "utf-8");
    return content;
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`File not found: ${params.path} (resolved: ${fullPath})`);
    if (err.code === "EISDIR") throw new Error(`Path is a directory: ${params.path}`);
    throw new Error(err.message ?? `Failed to read file: ${params.path}`);
  }
}