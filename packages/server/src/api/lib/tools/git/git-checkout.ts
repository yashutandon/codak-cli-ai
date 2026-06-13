import { exec } from "child_process";
import { promisify } from "util";
import { parseGitError } from "./parse-git-error";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 15_000;

function validateBranchName(branch: string): void {
  if (!branch.trim()) throw new Error("Branch name cannot be empty");
  if (branch.length > 255) throw new Error("Branch name too long");

  const invalid = [
    /\.\./,        // double dot
    /^-/,          // starts with dash
    /\/$/,         // ends with slash
    /\.$/,         // ends with dot
    /\.lock$/,     // ends with .lock
    /\s/,          // whitespace
    /[\x00-\x1f\x7f]/, // control chars
    /[~^:?*\[\\]/, // special chars
    /@\{/,         // @{
    /^@$/,         // just @
  ];

  for (const pattern of invalid) {
    if (pattern.test(branch)) {
      throw new Error(`Invalid branch name: "${branch}"`);
    }
  }
}

export async function gitCheckoutTool(
  params: { branch: string; create?: boolean },
  cwd: string
): Promise<string> {
  validateBranchName(params.branch);

  try {
    const flag = params.create ? "-b " : "";
    // stdout + stderr both — git writes success to stderr
    const { stdout, stderr } = await execAsync(
      `git checkout ${flag}${params.branch}`,
      { cwd, timeout: GIT_TIMEOUT }
    );
    return (stdout + stderr).trim() || `Switched to branch: ${params.branch}`;
  } catch (err: any) {
    const msg = (err.stderr ?? err.message ?? "").toString();
    if (msg.includes("already exists")) {
      throw new Error(`Branch already exists: "${params.branch}". Use create: false to switch.`);
    }
    if (msg.includes("did not match") || msg.includes("pathspec")) {
      throw new Error(`Branch not found: "${params.branch}". Use create: true to create it.`);
    }
    if (msg.includes("Your local changes")) {
      throw new Error("Uncommitted changes would be overwritten. Commit or stash first.");
    }
    return parseGitError(err);
  }
}