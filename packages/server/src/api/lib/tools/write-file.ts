import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";

export async function writeFileTool(
  params: { path: string; content: string },
  cwd: string
): Promise<string> {
  const fullPath = resolve(cwd, params.path);

  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, params.content, "utf-8");
    return `File written successfully: ${params.path}`;
  } catch (err: any) {
    throw new Error(`Failed to write file: ${err.message}`);
  }
}