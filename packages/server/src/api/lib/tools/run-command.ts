import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_LENGTH = 10_000;

const BLOCKED_COMMANDS = [
  /rm\s+-rf\s+\//,
  /sudo/,
  /shutdown/,
  /reboot/,
  /mkfs/,
  /dd\s+if=/,
];

export async function runCommandTool(
  params: { command: string },
  cwd: string
): Promise<string> {
  const { command } = params;

  for (const pattern of BLOCKED_COMMANDS) {
    if (pattern.test(command)) {
      throw new Error(`Command blocked for safety: ${command}`);
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_LENGTH,
    });

    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    return output || "(no output)";
  } catch (err: any) {
    if (err.killed) throw new Error(`Command timed out after ${TIMEOUT_MS / 1000}s`);
    throw new Error(`Command failed: ${err.message}`);
  }
}