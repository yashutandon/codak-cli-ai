import { generateText } from "ai";
import { getModel } from "../../model/get-model";

export async function runReviewAgent(
  code: string,
  cwd: string,
  modelId: string,
): Promise<string> {
  const { text } = await generateText({
    model: getModel(modelId),
    system: `You are a code review agent. Review code for:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Missing error handling
- Type safety issues

Working directory: ${cwd}

Be concise — only flag real issues. Format:
## Issues
- [CRITICAL/WARN/INFO] description

## Verdict
APPROVE / REQUEST_CHANGES`,
    messages: [{ role: "user", content: `Review this code:\n\n${code}` }],
  });

  return text;
}