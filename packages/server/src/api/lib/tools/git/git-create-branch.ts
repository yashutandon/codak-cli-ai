import { exec } from "child_process";
import { promisify } from "util";
import { gitCheckoutTool } from "./git-checkout";

const execAsync = promisify(exec);
const GIT_TIMEOUT = 15_000;

export async function gitCreateBranchTool(
  params: { branch: string },
  cwd: string
): Promise<string> {
  return gitCheckoutTool({ branch: params.branch, create: true }, cwd);
}