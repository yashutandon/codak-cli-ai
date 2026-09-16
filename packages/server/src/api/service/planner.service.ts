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

/**
 * Multi-Agent Pipeline: Orchestrator → CodingAgent (with tools) → ReviewAgent → Feedback Loop
 * 
 * For complex tasks, the orchestrator breaks the request into sub-tasks.
 * Each coding task is executed with full tool access, then reviewed.
 * If the review agent requests changes, the coding agent gets one retry with feedback.
 */
export async function runMultiAgent(
  userMessage: string,
  cwd: string,
  ragContext: string,
  modelId: string,
  sessionId: string,
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

  // Step 2: Run coding agent for each task, with review loop
  const results: string[] = [];

  for (const task of orchestration.tasks) {
    if (task.type === "code") {
      // Run CodingAgent with full tool access
      let code = await runCodingAgent(task, cwd, ragContext, modelId, sessionId, history);

      // Run ReviewAgent with read-only tool access
      const review = await runReviewAgent(
        task.description,
        task.filePaths,
        cwd,
        ragContext,
        modelId,
        sessionId,
      );

      if (review.verdict === "REQUEST_CHANGES" && review.issues.length > 0) {
        // Feedback loop: give the CodingAgent one chance to fix
        const feedbackTask = {
          ...task,
          description: `${task.description}\n\n⚠️ REVIEW FEEDBACK — Fix these issues:\n${review.issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`,
        };

        code = await runCodingAgent(feedbackTask, cwd, ragContext, modelId, sessionId, [
          ...history,
          { role: "assistant", content: code },
          { role: "user", content: `The review agent found issues. Please fix them:\n${review.issues.join("\n")}` },
        ]);

        // Second review (final, no more retries)
        const finalReview = await runReviewAgent(
          task.description,
          task.filePaths,
          cwd,
          ragContext,
          modelId,
          sessionId,
        );

        results.push(
          `### ${task.description}\n${code}\n\n**Review:** ${finalReview.verdict}\n${finalReview.issues.length > 0 ? finalReview.issues.map(i => `- ${i}`).join("\n") : "✅ No issues found"}`
        );
      } else {
        results.push(`### ${task.description}\n${code}\n\n**Review:** ✅ ${review.summary}`);
      }

    } else if (task.type === "review") {
      const review = await runReviewAgent(
        task.description,
        task.filePaths,
        cwd,
        ragContext,
        modelId,
        sessionId,
      );
      results.push(`### Review: ${task.description}\n**Verdict:** ${review.verdict}\n${review.issues.map(i => `- ${i}`).join("\n") || "✅ No issues"}`);

    } else if (task.type === "explain" || task.type === "test") {
      // For explain/test tasks, use simple generateText
      const { text } = await generateText({
        model: getModel(modelId),
        system: `You are Codak, an AI coding assistant.\nWorking directory: ${cwd}\n${ragContext}`,
        messages: [...history, { role: "user", content: task.description }],
      });
      results.push(`### ${task.description}\n${text}`);
    }
  }

  return `## ${orchestration.summary}\n\n${results.join("\n\n---\n\n")}`;
}