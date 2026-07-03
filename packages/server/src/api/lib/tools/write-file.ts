import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";

const MAX_WRITE_SIZE = 5 * 1024 * 1024; // 5MB max write

export async function writeFileTool(
  params: { path: string; content: string },
  cwd: string
): Promise<string> {
  if (params.content.length > MAX_WRITE_SIZE) {
    throw new Error(`File content too large (max 5MB): ${params.path}`);
  }

  const fullPath = resolve(cwd, params.path);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, params.content, "utf-8");

  return `File written successfully: ${params.path}`;
}