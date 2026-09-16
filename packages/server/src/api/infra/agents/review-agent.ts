import { streamText, stepCountIs, tool } from "ai";
import { tools as toolDefinitions, type ToolName } from "@codak/shared";
import { getModel } from "../../model/get-model";
import { executeTool } from "../../lib/tools";

/**
 * Build a read-only tool set for the ReviewAgent.
 * It can inspect files but CANNOT modify anything.
 */
function buildReviewTools(cwd: string, sessionId: string) {
  const makeExecute = (name: ToolName) => async (args: Record<string, unknown>) =>
    executeTool(name, args, cwd, sessionId);

  return {
    read_file:    tool({ description: toolDefinitions.read_file.description,    inputSchema: toolDefinitions.read_file.parameters,    execute: makeExecute("read_file") }),
    list_files:   tool({ description: toolDefinitions.list_files.description,   inputSchema: toolDefinitions.list_files.parameters,   execute: makeExecute("list_files") }),
    search_files: tool({ description: toolDefinitions.search_files.description, inputSchema: toolDefinitions.search_files.parameters, execute: makeExecute("search_files") }),
  };
}

export interface ReviewResult {
  verdict: "APPROVE" | "REQUEST_CHANGES";
  issues: string[];
  summary: string;
}

/**
 * ReviewAgent — inspects code written by the CodingAgent using read-only tools.
 * Returns a structured verdict with issues list.
 */
export async function runReviewAgent(
  taskDescription: string,
  filePaths: string[],
  cwd: string,
  ragContext: string,
  modelId: string,
  sessionId: string,
): Promise<ReviewResult> {
  const result = streamText({
    model: getModel(modelId),
    system: `You are a code review agent. You review code that was just written by a coding agent.
Working directory: ${cwd}
${ragContext ? `Codebase context:\n${ragContext}\n` : ""}

Your job:
1. Read the files that were modified (listed below)
2. Review for: bugs, logic errors, security vulnerabilities, performance issues, missing error handling, type safety
3. Check that the code matches existing project patterns and conventions

Files to review: ${filePaths.join(", ") || "use search_files to find recently changed files"}

RESPOND WITH EXACTLY THIS JSON FORMAT (no markdown, no explanation):
{
  "verdict": "APPROVE" | "REQUEST_CHANGES",
  "issues": ["issue 1 description", "issue 2 description"],
  "summary": "one-line summary of review"
}

Rules:
- Only flag REAL issues — no nitpicks
- APPROVE if code is production-ready
- REQUEST_CHANGES only for bugs, security issues, or broken functionality`,
    messages: [
      { role: "user", content: `Review the code for task: ${taskDescription}\nFiles: ${filePaths.join(", ")}` },
    ],
    tools: buildReviewTools(cwd, sessionId),
    stopWhen: stepCountIs(3),
  });

  // Collect all text
  const parts: string[] = [];
  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      parts.push(chunk.text);
    }
  }

  const text = parts.join("") || (await result.text);

  // Parse the JSON verdict
  try {
    // Extract JSON from potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        verdict: parsed.verdict === "APPROVE" ? "APPROVE" : "REQUEST_CHANGES",
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        summary: parsed.summary ?? text.slice(0, 200),
      };
    }
  } catch {
    // If JSON parsing fails, infer from text
  }

  // Fallback: infer verdict from text content
  const isApproved = text.toUpperCase().includes("APPROVE") && !text.toUpperCase().includes("REQUEST_CHANGES");
  return {
    verdict: isApproved ? "APPROVE" : "REQUEST_CHANGES",
    issues: isApproved ? [] : [text.slice(0, 500)],
    summary: text.slice(0, 200),
  };
}