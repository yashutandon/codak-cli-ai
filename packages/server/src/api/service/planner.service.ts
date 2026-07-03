import { generateText, streamText, stepCountIs, tool } from "ai";
import { getModel } from "../model/get-model";
import { runOrchestrator, runCodingAgent, runReviewAgent } from "../infra/agents/index"

export async function runPlanner(
  userMessage: string,
  cwd: string,
  ragContext: string,
  modelId: string,
  history: { role: "user" | "assistant"; content: string }[],
  images?: string[]
): Promise<string> {
  const currentUserMessage = images?.length
    ? {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userMessage },
          ...images.map((img) => ({ type: "image" as const, image: img })),
        ],
      }
    : { role: "user" as const, content: userMessage };
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
- Order steps by dependency`,
    messages: [...history, currentUserMessage],
  });

  return text;
}

export async function runMultiAgent(
  userMessage: string,
  cwd: string,
  ragContext: string,
  modelId: string,
  history: { role: "user" | "assistant"; content: string }[],
  images?: string[]
): Promise<string> {
  const currentUserMessage = images?.length
    ? {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userMessage },
          ...images.map((img) => ({ type: "image" as const, image: img })),
        ],
      }
    : { role: "user" as const, content: userMessage };
  // Step 1: Orchestrator — task breakdown
  const orchestration = await runOrchestrator(
    userMessage, cwd, ragContext, modelId
  );

  if (!orchestration.isComplex) {
    // Simple task — direct response
    const { text } = await generateText({
      model: getModel(modelId),
      system: `You are Codak, an AI coding assistant.\nWorking directory: ${cwd}\n${ragContext}`,
      messages: [...history, currentUserMessage],
    });
    return text;
  }

  // Step 2: Run coding agent for each task
  const results: string[] = [];

  for (const task of orchestration.tasks) {
    if (task.type === "code") {
      const code = await runCodingAgent(task, cwd, ragContext, modelId, history);

      // Step 3: Review agent
      const review = await runReviewAgent(code, cwd, modelId);
      const approved = review.includes("APPROVE");

      results.push(`### ${task.description}\n${code}${!approved ? `\n\n**Review:**\n${review}` : ""}`);
    } else if (task.type === "review") {
      const review = await runReviewAgent(task.description, cwd, modelId);
      results.push(`### Review\n${review}`);
    }
  }

  return `## ${orchestration.summary}\n\n${results.join("\n\n---\n\n")}`;
}