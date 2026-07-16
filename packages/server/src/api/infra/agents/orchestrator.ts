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

/**
 * Score-based complexity detection.
 *
 * Each signal adds points. Only messages reaching COMPLEXITY_THRESHOLD
 * are routed to the multi-agent pipeline, avoiding false positives on
 * simple commands like "add a button" or "fix the typo".
 *
 * Signals:
 *  +2  — multi-file scope words ("across", "all files", "throughout", "every file")
 *  +2  — full-feature keywords ("implement", "scaffold", "migrate", "refactor", "integrate")
 *  +1  — creation keywords ("create", "build", "setup", "add")
 *  +1  — technical domain keywords (auth, middleware, database, payment, API, websocket, etc.)
 *  +1  — message > 40 words (detailed request)
 *  +1  — specific file path mentioned (e.g. "src/", ".ts", ".tsx")
 *  +2  — AND conjunction indicating multi-step ("and then", "then", "after that", "followed by")
 *
 * Threshold: 4 points to trigger multi-agent.
 */
const COMPLEXITY_THRESHOLD = 4;

export function detectComplexity(message: string): boolean {
  const lower = message.toLowerCase();
  const wordCount = lower.trim().split(/\s+/).length;
  let score = 0;

  // Multi-file scope
  if (/\b(across|throughout|all files|every file|entire codebase|globally)\b/.test(lower)) score += 2;

  // Full-feature keywords (high signal)
  if (/\b(implement|scaffold|migrate|refactor|integrate|rewrite|redesign)\b/.test(lower)) score += 2;

  // Creation keywords (medium signal — common but ambiguous alone)
  if (/\b(create|build|setup|set up|add)\b/.test(lower)) score += 1;

  // Technical domain keywords
  if (/\b(auth(?:entication|orization)?|middleware|database|payment|api|websocket|webhook|cron|queue|worker|cache|redis|migration|schema)\b/.test(lower)) score += 1;

  // Detailed request (long message)
  if (wordCount > 40) score += 1;

  // Specific file path mentioned
  if (/\b(src\/|lib\/|api\/|\.ts\b|\.tsx\b|\.js\b)/.test(lower)) score += 1;

  // Multi-step conjunction
  if (/\b(and then|then|after that|followed by|also|additionally|furthermore)\b/.test(lower)) score += 2;

  return score >= COMPLEXITY_THRESHOLD;
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