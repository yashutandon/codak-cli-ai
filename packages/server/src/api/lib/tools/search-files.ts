import { readdir, stat } from "fs/promises";
import { resolve, join, relative } from "path";

const IGNORE_DIRS = new Set([".git", "node_modules", ".next", "dist", "build"]);

async function glob(
  pattern: string,
  basePath: string,
  currentPath: string,
  results: string[]
): Promise<void> {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = join(currentPath, entry.name);
    const relPath = relative(basePath, fullPath);

    if (entry.isDirectory()) {
      await glob(pattern, basePath, fullPath, results);
    } else {
      const regex = new RegExp(
        "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      if (regex.test(entry.name)) {
        results.push(relPath);
      }
    }
  }
}

export async function searchFilesTool(
  params: { pattern: string; path?: string },
  cwd: string
): Promise<string> {
  const safePath = (params.path ?? ".").replace(/^\/+/, "");
  const searchPath = resolve(cwd, safePath);
  const results: string[] = [];

  try {
    await glob(params.pattern, searchPath, searchPath, results);
    if (results.length === 0) return `No files found matching: ${params.pattern}`;
    return results.join("\n");
  } catch (err: any) {
    throw new Error(`Search failed: ${err.message}`);
  }
}