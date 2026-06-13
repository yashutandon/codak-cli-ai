import { exec } from "child_process";
import { promisify } from "util";
import { parseGitError } from "./parse-git-error";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 15_000;
const MAX_DIFF_LENGTH = 8000;

export async function gitDiffTool(
  params: { staged?: boolean; file?: string },
  cwd: string
): Promise<string> {
  try {
    const args = ["git", "diff", "--stat", "\n"];
    const diffArgs = ["git", "diff"];
    if (params.staged) diffArgs.push("--staged");
    if (params.file) diffArgs.push("--", params.file);

    const { stdout } = await execAsync(diffArgs.join(" "), {
      cwd,
      timeout: GIT_TIMEOUT,
    });

    if (!stdout.trim()) {
      return params.staged ? "No staged changes" : "No unstaged changes";
    }

    return stdout.length > MAX_DIFF_LENGTH
      ? stdout.slice(0, MAX_DIFF_LENGTH) + "\n\n...(truncated — use file param to diff specific files)"
      : stdout;
  } catch (err: any) {
    return parseGitError(err);
  }
}