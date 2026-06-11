import { generateText } from "ai";
import { getModel } from "../model/get-model";

export async function runPlanner(
  userMessage: string,
  cwd: string,
  ragContext: string,
  modelId: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const { text } = await generateText({
    model: getModel(modelId),
    system: `You are Codak's planning engine. You analyze codebases and create precise, actionable plans.

Working directory: ${cwd}
${ragContext ? `\nCodebase context:\n${ragContext}\n` : ""}

YOUR JOB:
- Analyze what the user wants to build or fix
- Break it down into clear, ordered steps
- Identify risks, edge cases, missing info
- Never write actual code — only plan

OUTPUT FORMAT (always):
## Goal
One line summary of what needs to be done.

## Steps
1. [file/component] — what to do and why
2. [file/component] — what to do and why
...

## Dependencies
What needs to exist before this can be done.

## Risks
What could go wrong, what to watch out for.

## Questions (optional)
Only if something is genuinely unclear — max 2 questions.

RULES:
- Be specific — "create src/middleware/auth.ts with JWT validation" not "add auth"
- Reference actual file paths based on codebase context
- Order steps by dependency — things that others depend on come first
- If codebase context is available, use it — don't make assumptions`,
    messages: [
      ...history,
      { role: "user" as const, content: userMessage },
    ],
  });

  return text;
}