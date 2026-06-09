import { readdir } from "fs/promises";
import { resolve } from "path";

export async function listFilesTool(
  params: { path?: string },
  cwd: string
): Promise<string> {
  const safePath = (params.path ?? ".").replace(/^\/+/, "");
  const targetPath = resolve(cwd, safePath);

  try {
    const entries = await readdir(targetPath, { withFileTypes: true });

    const lines = entries.map((entry) => {
      const prefix = entry.isDirectory() ? "📁" : "📄";
      return `${prefix} ${entry.name}`;
    });

    return `Contents at ${targetPath}:\n` + (lines.join("\n") || "(empty directory)");
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`Directory not found: ${targetPath}`);
    throw new Error(`Failed to list files: ${err.message}`);
  }
}