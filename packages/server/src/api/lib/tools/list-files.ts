import { readdir, stat } from "fs/promises";
import { resolve, join } from "path";

export async function listFilesTool(
  params: { path?: string },
  cwd: string
): Promise<string> {
  const targetPath = resolve(cwd, params.path ?? ".");

  try {
    const entries = await readdir(targetPath, { withFileTypes: true });

    const lines = await Promise.all(
      entries.map(async (entry) => {
        const prefix = entry.isDirectory() ? "📁" : "📄";
        return `${prefix} ${entry.name}`;
      })
    );

    return lines.join("\n") || "(empty directory)";
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`Directory not found: ${params.path}`);
    throw new Error(`Failed to list files: ${err.message}`);
  }
}