import { exec } from "child_process";
import { promisify } from "util";
import { parseGitError } from "./parse-git-error";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 15_000;

export async function gitLogTool(
  params: { limit?: number },
  cwd: string
): Promise<string> {
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);

  try {
    const { stdout } = await execAsync(
      `git log --format="%h %s (%an, %ar)" -n ${limit}`,
      { cwd, timeout: GIT_TIMEOUT }
    );

    if (!stdout.trim()) return "No commits yet";
    return stdout.trim();
  } catch (err: any) {
    const msg = (err.stderr ?? err.message ?? "").toString();
    if (msg.includes("does not have any commits") || msg.includes("ambiguous argument")) {
      return "No commits yet";
    }
    return parseGitError(err);
  }
}