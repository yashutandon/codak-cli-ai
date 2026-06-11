import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";

export async function writeFileTool(
  params: { path: string; content: string },
  cwd: string
): Promise<string> {

  console.log("WRITE TOOL CALLED");
  console.log(params);
  console.log("cwd:", cwd);

  const fullPath = resolve(cwd, params.path);

  console.log("fullPath:", fullPath);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, params.content, "utf-8");

  return `File written successfully: ${params.path}`;
}