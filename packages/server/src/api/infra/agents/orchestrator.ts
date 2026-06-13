import { generateText } from "ai";
import { getModel } from "../../model/get-model";

export type AgentTask = {
  type: "code" | "test" | "review" | "explain";
  description: string;
  filePaths: string[];
};

export type OrchestratorResult = {
  isComplex: boolean;
  tasks: AgentTask[];
  summary: string;
};

const COMPLEXITY_THRESHOLD = 5;

function detectComplexity(message: string): boolean {
  const complexKeywords = /build|implement|create|add|setup|integrate|refactor|migrate|scaffold/i;
  const wordCount = message.trim().split(/\s+/).length;
  return complexKeywords.test(message) && wordCount >= COMPLEXITY_THRESHOLD;
}

export async function runOrchestrator(
  userMessage: string,
  cwd: string,
  ragContext: string,
  modelId: string,
): Promise<OrchestratorResult> {
  const isComplex = detectComplexity(userMessage);

  if (!isComplex) {
    return { isComplex: false, tasks: [], summary: userMessage };
  }

  const { text } = await generateText({
    model: getModel(modelId),
    system: `You are a task orchestrator for an AI coding agent.
Working directory: ${cwd}
${ragContext ? `Codebase context:\n${ragContext}\n` : ""}

Analyze the user's request and break it into specific agent tasks.
Respond ONLY with valid JSON — no markdown, no explanation.

JSON format:
{
  "summary": "one line summary",
  "tasks": [
    {
      "type": "code|test|review|explain",
      "description": "exactly what to do",
      "filePaths": ["path/to/file.ts"]
    }
  ]
}

Task types:
- code: write or modify code
- test: write or run tests
- review: review code quality
- explain: explain existing code`,
    messages: [{ role: "user", content: userMessage }],
  });

  try {
    const parsed = JSON.parse(text);
    return {
      isComplex: true,
      tasks: parsed.tasks ?? [],
      summary: parsed.summary ?? userMessage,
    };
  } catch {
    return { isComplex: false, tasks: [], summary: userMessage };
  }
}