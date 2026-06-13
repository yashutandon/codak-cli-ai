import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

export async function editFileTool(
  params: { path: string; old_str: string; new_str: string },
  cwd: string
): Promise<string> {
  const safePath = params.path.replace(/^\/+/, "");
  const fullPath = resolve(cwd, safePath);

  let content: string;
  try {
    content = await readFile(fullPath, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") throw new Error(`File not found: ${params.path}`);
    throw new Error(`Failed to read file: ${err.message}`);
  }

  const occurrences = content.split(params.old_str).length - 1;
  if (occurrences === 0) {
    throw new Error(`String not found in file: ${params.path}\nLooking for:\n${params.old_str}`);
  }
  if (occurrences > 1) {
    throw new Error(`Ambiguous edit — found ${occurrences} occurrences. Make old_str more specific.`);
  }

  const newContent = content.replace(params.old_str, params.new_str);
  await writeFile(fullPath, newContent, "utf-8");

  return `Edited ${params.path}: replaced 1 occurrence`;
}