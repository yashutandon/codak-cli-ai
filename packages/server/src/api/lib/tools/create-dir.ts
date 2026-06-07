import { mkdir } from "fs/promises";
import { resolve } from "path";

export async function createDirectoryTool(
  params: { path: string },
  cwd: string
): Promise<string> {
  const fullPath = resolve(cwd, params.path);

  try {
    await mkdir(fullPath, { recursive: true });
    return `Directory created: ${params.path}`;
  } catch (err: any) {
    throw new Error(`Failed to create directory: ${err.message}`);
  }
}