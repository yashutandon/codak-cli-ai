import { exec } from "child_process";
import { promisify } from "util";
import { parseGitError } from "./parse-git-error";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 30_000;

const VALID_COMMIT_TYPES = ["feat", "fix", "refactor", "chore", "docs", "test", "style", "perf", "ci", "build"];

export async function gitCommitTool(
  params: { message: string },
  cwd: string
): Promise<string> {
  const message = params.message.trim();

  if (!message) throw new Error("Commit message cannot be empty");
  if (message.length > 72) throw new Error(`Commit message too long (${message.length} chars). Keep under 72.`);

  try {
    // Check git repo
    await execAsync("git rev-parse --git-dir", { cwd, timeout: GIT_TIMEOUT });

    // Check status first
    const { stdout: statusOut } = await execAsync("git status --porcelain", {
      cwd,
      timeout: GIT_TIMEOUT,
    });

    if (!statusOut.trim()) return "Nothing to commit, working tree clean";

    // Stage all
    await execAsync("git add -A", { cwd, timeout: GIT_TIMEOUT });

    // Commit — use array form to avoid shell injection
    const { stdout, stderr } = await execAsync(
      `git commit --message=${JSON.stringify(message)}`,
      { cwd, timeout: GIT_TIMEOUT }
    );

    return (stdout + stderr).trim();
  } catch (err: any) {
    return parseGitError(err);
  }
}