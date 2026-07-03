import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { editFileTool } from "./edit-file";
import { listFilesTool } from "./list-files";
import { runCommandTool } from "./run-command";
import { createDirectoryTool } from "./create-dir";
import { deleteFileTool } from "./delete-file";
import { searchFilesTool } from "./search-files";
import { validateToolCall } from "./validate-toolcall";
import { waitForApproval } from "./approval.service";
import { db } from "@codak/database";
import type { ToolName } from "@codak/shared";
import { triggerReindex } from "../../infra/embeddings";
import {
  gitStatusTool,
  gitDiffTool,
  gitCommitTool,
  gitCheckoutTool,
  gitLogTool,
  gitCreateBranchTool,
} from "./git";
import { randomUUID } from "crypto";

/**
 * Tools that require explicit user confirmation before execution.
 * These are destructive or potentially irreversible actions.
 */
const APPROVAL_REQUIRED_TOOLS: Set<ToolName> = new Set([
  "delete_file",
  "run_command",
  "git_commit",
  "git_checkout",
  "git_create_branch",
]);

/**
 * SSE stream reference — set by the message controller so the executor
 * can push an approval-request event to the CLI.
 */
let activeStreamController: ReadableStreamDefaultController | null = null;

export function setActiveStreamController(
  controller: ReadableStreamDefaultController | null
) {
  activeStreamController = controller;
}

function pushSSEEvent(data: object) {
  if (!activeStreamController) return;
  try {
    const encoder = new TextEncoder();
    activeStreamController.enqueue(
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    );
  } catch {
    // Stream may already be closed
  }
}

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  cwd: string,
  sessionId?: string
): Promise<string> {
  const check = validateToolCall(name, args, cwd);
  if (!check.allowed) {
    throw new Error(`[Firewall] Tool blocked — ${check.reason}`);
  }

  // ── Dangerous tools require user approval via CLI ──────────────
  if (APPROVAL_REQUIRED_TOOLS.has(name)) {
    const toolCallId = randomUUID();

    pushSSEEvent({
      type: "tool-approval-required",
      toolCallId,
      toolName: name,
      args,
    });

    const approved = await waitForApproval(toolCallId);

    if (!approved) {
      const reason = `User rejected execution of '${name}'`;
      throw new Error(`[Approval] ${reason}`);
    }
  }

  const startTime = Date.now();
  let result: string;

  try {
    switch (name) {
      case "read_file":        result = await readFileTool(args as any, cwd); break;
      case "write_file":       result = await writeFileTool(args as any, cwd); break;
      case "edit_file":        result = await editFileTool(args as any, cwd); break;
      case "list_files":       result = await listFilesTool(args as any, cwd); break;
      case "run_command":      result = await runCommandTool(args as any, cwd, sessionId); break;
      case "create_directory": result = await createDirectoryTool(args as any, cwd); break;
      case "delete_file":      result = await deleteFileTool(args as any, cwd); break;
      case "search_files":     result = await searchFilesTool(args as any, cwd); break;

      // Git tools
      case "git_status":        result = await gitStatusTool(cwd); break;
      case "git_diff":          result = await gitDiffTool(args as any, cwd); break;
      case "git_commit":        result = await gitCommitTool(args as any, cwd); break;
      case "git_checkout":      result = await gitCheckoutTool(args as any, cwd); break;
      case "git_log":           result = await gitLogTool(args as any, cwd); break;
      case "git_create_branch": result = await gitCreateBranchTool(args as any, cwd); break;

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

  if (sessionId && (name === "write_file" || name === "edit_file" || name === "delete_file")) {
    const filePath = String(args.path ?? "");
    if (filePath) {
      await triggerReindex(sessionId, filePath, cwd).catch((err) =>
        console.error("[RAG] Reindex enqueue failed:", err)
      );
    }
  }

  return result;
}