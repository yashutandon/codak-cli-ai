import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { editFileTool } from "./edit-file";
import { listFilesTool } from "./list-files";
import { runCommandTool } from "./run-command";
import { createDirectoryTool } from "./create-dir";
import { deleteFileTool } from "./delete-file";
import { searchFilesTool } from "./search-files";
import { validateToolCall } from "./validate-toolcall";
import { db } from "@codak/database";
import type { ToolName } from "@codak/shared";
import { triggerReindex } from "../../infra/embeddings";

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  cwd: string,
  sessionId?: string
): Promise<string> {
  const check = validateToolCall(name, args);
  if (!check.allowed) {
    throw new Error(`[Firewall] Tool blocked — ${check.reason}`);
  }

  const startTime = Date.now();
  let result: string;

  try {
    switch (name) {
      case "read_file": result = await readFileTool(args as any, cwd); break;
      case "write_file": result = await writeFileTool(args as any, cwd); break;
      case "edit_file": result = await editFileTool(args as any, cwd); break;
      case "list_files": result = await listFilesTool(args as any, cwd); break;
      case "run_command": result = await runCommandTool(args as any, cwd); break;
      case "create_directory": result = await createDirectoryTool(args as any, cwd); break;
      case "delete_file": result = await deleteFileTool(args as any, cwd); break;
      case "search_files": result = await searchFilesTool(args as any, cwd); break;
      default: throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    if (sessionId) {
      await db.toolExecution.create({
        data: {
          sessionId,
          toolName: name,
          args: JSON.parse(JSON.stringify(args)),
          result: "",
          duration: Date.now() - startTime,
          error: err.message,
        },
      });
    }
    throw err;
  }

  if (sessionId) {
    await db.toolExecution.create({
      data: {
        sessionId,
        toolName: name,
        args: JSON.parse(JSON.stringify(args)),
        result: result.slice(0, 5000),
        duration: Date.now() - startTime,
      },
    });
  }

  if (sessionId && (name === "write_file" || name === "edit_file")) {
    const filePath = String(args.path ?? "");
    if (filePath) {
      triggerReindex(sessionId, filePath, cwd).catch((err) =>
        console.error("[RAG] Reindex failed:", err)
      );
    }
  }

  return result;
}

