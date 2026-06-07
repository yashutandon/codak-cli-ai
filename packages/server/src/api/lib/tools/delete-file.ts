import { rm } from "fs/promises";
import { resolve } from "path";

export async function deleteFileTool(
  params: { path: string },
  cwd: string
): Promise<string> {
  const fullPath = resolve(cwd, params.path);

  try {
    await rm(fullPath, { recursive: false, force: false });
    return `Deleted: ${params.path}`;
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`Not found: ${params.path}`);
    if (err.code === "ENOTEMPTY") throw new Error(`Directory not empty: ${params.path}`);
    throw new Error(`Failed to delete: ${err.message}`);
  }
}