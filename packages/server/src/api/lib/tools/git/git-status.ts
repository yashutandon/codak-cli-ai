import { exec } from "child_process";
import { promisify } from "util";
import { parseGitError } from "./parse-git-error";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 15_000;

export async function gitStatusTool(cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync("git status --porcelain=v1 -u", {
      cwd,
      timeout: GIT_TIMEOUT,
    });

    if (!stdout.trim()) return "Nothing to commit, working tree clean";

    const staged: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const line of stdout.trim().split("\n")) {
      const x = line[0]!;
      const y = line[1]!;
      const file = line.slice(3);

      if (x === "U" || y === "U" || (x === "A" && y === "A") || (x === "D" && y === "D")) {
        conflicted.push(`  !! ${file}`);
        continue;
      }
      if (x !== " " && x !== "?") staged.push(`  ${x}  ${file}`);
      if (y === "M") modified.push(`  M  ${file}`);
      if (y === "D" && x === " ") deleted.push(`  D  ${file}`);
      if (x === "?" && y === "?") untracked.push(`  ?  ${file}`);
    }

    const parts: string[] = [];
    if (conflicted.length) parts.push(`Conflicts:\n${conflicted.join("\n")}`);
    if (staged.length)     parts.push(`Staged:\n${staged.join("\n")}`);
    if (modified.length)   parts.push(`Modified:\n${modified.join("\n")}`);
    if (deleted.length)    parts.push(`Deleted:\n${deleted.join("\n")}`);
    if (untracked.length)  parts.push(`Untracked:\n${untracked.join("\n")}`);

    return parts.join("\n\n");
  } catch (err: any) {
    return parseGitError(err);
  }
}