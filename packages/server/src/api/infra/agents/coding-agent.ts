import { streamText, stepCountIs, tool } from "ai";
import { tools as toolDefinitions, type ToolName } from "@codak/shared";
import { getModel } from "../../model/get-model";
import { executeTool } from "../../lib/tools";
import type { AgentTask } from "./orchestrator";

/**
 * Build the full tool set for the CodingAgent.
 * Same tools as the main pipeline so it can read, write, edit, and run commands.
 */
function buildAgentTools(cwd: string, sessionId: string) {
  const makeExecute = (name: ToolName) => async (args: Record<string, unknown>) =>
    executeTool(name, args, cwd, sessionId);

  return {
    read_file:        tool({ description: toolDefinitions.read_file.description,        inputSchema: toolDefinitions.read_file.parameters,        execute: makeExecute("read_file") }),
    write_file:       tool({ description: toolDefinitions.write_file.description,       inputSchema: toolDefinitions.write_file.parameters,       execute: makeExecute("write_file") }),
    edit_file:        tool({ description: toolDefinitions.edit_file.description,        inputSchema: toolDefinitions.edit_file.parameters,        execute: makeExecute("edit_file") }),
    list_files:       tool({ description: toolDefinitions.list_files.description,       inputSchema: toolDefinitions.list_files.parameters,       execute: makeExecute("list_files") }),
    run_command:      tool({ description: toolDefinitions.run_command.description,      inputSchema: toolDefinitions.run_command.parameters,      execute: makeExecute("run_command") }),
    create_directory: tool({ description: toolDefinitions.create_directory.description, inputSchema: toolDefinitions.create_directory.parameters, execute: makeExecute("create_directory") }),
    delete_file:      tool({ description: toolDefinitions.delete_file.description,      inputSchema: toolDefinitions.delete_file.parameters,      execute: makeExecute("delete_file") }),
    search_files:     tool({ description: toolDefinitions.search_files.description,     inputSchema: toolDefinitions.search_files.parameters,     execute: makeExecute("search_files") }),
    git_status:       tool({ description: toolDefinitions.git_status.description,       inputSchema: toolDefinitions.git_status.parameters,       execute: makeExecute("git_status") }),
    git_diff:         tool({ description: toolDefinitions.git_diff.description,         inputSchema: toolDefinitions.git_diff.parameters,         execute: makeExecute("git_diff") }),
    git_commit:       tool({ description: toolDefinitions.git_commit.description,       inputSchema: toolDefinitions.git_commit.parameters,       execute: makeExecute("git_commit") }),
    git_checkout:     tool({ description: toolDefinitions.git_checkout.description,     inputSchema: toolDefinitions.git_checkout.parameters,     execute: makeExecute("git_checkout") }),
    git_log:          tool({ description: toolDefinitions.git_log.description,          inputSchema: toolDefinitions.git_log.parameters,          execute: makeExecute("git_log") }),
    git_create_branch:tool({ description: toolDefinitions.git_create_branch.description,inputSchema: toolDefinitions.git_create_branch.parameters,execute: makeExecute("git_create_branch") }),
  };
}

/**
 * CodingAgent — runs with full tool access to actually modify the filesystem.
 * Uses streamText + stepCountIs(5) to prevent runaway tool loops.
 * Returns the concatenated text from all steps.
 */
export async function runCodingAgent(
  task: AgentTask,
  cwd: string,
  ragContext: string,
  modelId: string,
  sessionId: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const result = streamText({
    model: getModel(modelId),
    system: `You are a coding agent. You write clean, production-ready code by using tools to directly modify the filesystem.
Working directory: ${cwd}
${ragContext ? `Codebase context:\n${ragContext}\n` : ""}

Task: ${task.description}
Files involved: ${task.filePaths.join(", ") || "to be determined"}

Rules:
- ALWAYS read files before editing them
- Write complete, working code — no stubs or placeholders
- Match existing code style and conventions
- All imports must be real and resolvable
- After writing code, run the build to verify it compiles
- If the build fails, fix the error and retry`,
    messages: [
      ...history,
      { role: "user", content: task.description },
    ],
    tools: buildAgentTools(cwd, sessionId),
    stopWhen: stepCountIs(5),
  });

  // Collect all step texts
  const parts: string[] = [];
  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      parts.push(chunk.text);
    }
  }

  return parts.join("") || (await result.text);
}