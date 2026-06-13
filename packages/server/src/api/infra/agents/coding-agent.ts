import { generateText } from "ai";
import { getModel } from "../../model/get-model";
import type { AgentTask } from "./orchestrator";

export async function runCodingAgent(
  task: AgentTask,
  cwd: string,
  ragContext: string,
  modelId: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const { text } = await generateText({
    model: getModel(modelId),
    system: `You are a coding agent. You write clean, production-ready code.
Working directory: ${cwd}
${ragContext ? `Codebase context:\n${ragContext}\n` : ""}

Task: ${task.description}
Files involved: ${task.filePaths.join(", ") || "to be determined"}

Rules:
- Write complete, working code
- Match existing code style
- No placeholder TODOs
- All imports must be real`,
    messages: [
      ...history,
      { role: "user", content: task.description },
    ],
  });

  return text;
}