import fg from "fast-glob";
import { resolve } from "path";

const MAX_RESULTS = 1000;

export async function searchFilesTool(
  params: { pattern: string; path?: string },
  cwd: string
): Promise<string> {
  const safePath = (params.path ?? ".").replace(/^\/+/, "");
  const searchPath = resolve(cwd, safePath);

  try {
    const results = await fg(params.pattern, {
      cwd: searchPath,
      ignore: ["**/.git/**", "**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**"],
      dot: true,
      onlyFiles: true,
    });

    if (results.length === 0) return `No files found matching: ${params.pattern}`;
    
    if (results.length > MAX_RESULTS) {
      return `Found ${results.length} files. Showing first ${MAX_RESULTS}:\n\n` + 
             results.slice(0, MAX_RESULTS).join("\n");
    }
    
    return results.join("\n");
  } catch (err: any) {
    throw new Error(`Search failed: ${err.message}`);
  }
}