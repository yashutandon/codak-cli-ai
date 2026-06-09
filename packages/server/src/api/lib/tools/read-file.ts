import { readFile } from "fs/promises";
import { resolve } from "path";

export async function readFileTool(
  params: { path: string },
  cwd: string
): Promise<string> {
  // Leading slashes strip — absolute path se relative banao
const safePath = params.path.replace(/^\/+/, "");
const fullPath = resolve(cwd, safePath);
  try {
    const content = await readFile(fullPath, "utf-8");
    return content;
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`File not found: ${params.path} (resolved: ${fullPath})`);
    if (err.code === "EISDIR") throw new Error(`Path is a directory: ${params.path}`);
    throw new Error(`Failed to read file: ${err.message}`);
  }
}