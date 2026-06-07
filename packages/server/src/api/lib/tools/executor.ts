import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { listFilesTool } from "./list-files";
import { runCommandTool } from "./run-command";
import { createDirectoryTool } from "./create-dir";
import { deleteFileTool } from "./delete-file";
import { searchFilesTool } from "./search-files";
import type { ToolName } from "@codak/shared";

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  cwd: string
): Promise<string> {
  switch (name) {
    case "read_file":
      return readFileTool(args as any, cwd);
    case "write_file":
      return writeFileTool(args as any, cwd);
    case "list_files":
      return listFilesTool(args as any, cwd);
    case "run_command":
      return runCommandTool(args as any, cwd);
    case "create_directory":
      return createDirectoryTool(args as any, cwd);
    case "delete_file":
      return deleteFileTool(args as any, cwd);
    case "search_files":
      return searchFilesTool(args as any, cwd);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}