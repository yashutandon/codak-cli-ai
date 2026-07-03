import { resolve } from "path";

type FirewallResult =
  | { allowed: true }
  | { allowed: false; reason: string };

const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /rm\s+-rf/i,        reason: "Recursive force delete blocked" },
  { pattern: /del\s+\/f/i,       reason: "Force delete blocked" },
  { pattern: /format\s+[a-z]:/i, reason: "Disk format blocked" },
  { pattern: /shutdown/i,        reason: "Shutdown command blocked" },
  { pattern: /reboot/i,          reason: "Reboot command blocked" },
  { pattern: /mkfs/i,            reason: "Filesystem format blocked" },
  { pattern: /dd\s+if=/i,        reason: "Disk dump command blocked" },
  { pattern: /sudo/i,            reason: "Sudo not allowed" },
  { pattern: />\s*\/dev\/(sd|hd|nvme)/i, reason: "Direct disk write blocked" },
  { pattern: /curl\s+.*\|\s*(sh|bash)/i, reason: "Pipe-to-shell blocked" },
  { pattern: /wget\s+.*\|\s*(sh|bash)/i, reason: "Pipe-to-shell blocked" },
];

/**
 * Validate that a resolved path is strictly inside the allowed cwd.
 * Works on both Unix and Windows paths.
 */
function isPathSafe(rawPath: string, cwd: string): boolean {
  if (!rawPath) return false;

  // Normalize the path without resolving (catches .. patterns)
  const normalized = rawPath
    .replace(/\\/g, "/") // Windows → Unix separators
    .replace(/\/+/g, "/"); // Collapse double slashes

  // Block obvious traversal patterns (both Unix and Windows)
  if (normalized.includes("../") || normalized.includes("..\\")) return false;
  if (/^\.\.$/.test(normalized.trim())) return false;

  // Resolve to absolute and verify it stays within cwd
  try {
    const resolved = resolve(cwd, rawPath);
    const normalizedCwd = resolve(cwd); // ensure trailing slash
    // Must start with cwd + separator (not just cwd prefix match)
    return (
      resolved === normalizedCwd ||
      resolved.startsWith(normalizedCwd + "/") ||
      resolved.startsWith(normalizedCwd + "\\")
    );
  } catch {
    return false;
  }
}

export function validateToolCall(
  toolName: string,
  args: Record<string, unknown>,
  cwd?: string
): FirewallResult {
  // run_command — command string check
  if (toolName === "run_command") {
    const command = String(args.command ?? "");
    for (const { pattern, reason } of HIGH_RISK_PATTERNS) {
      if (pattern.test(command)) {
        return { allowed: false, reason };
      }
    }
  }

  // File operation tools — strict path containment check
  if (["delete_file", "write_file", "edit_file", "read_file"].includes(toolName)) {
    const rawPath = String(args.path ?? "");

    if (!rawPath) {
      return { allowed: false, reason: "Path is required" };
    }

    if (cwd && !isPathSafe(rawPath, cwd)) {
      return {
        allowed: false,
        reason: `Path is outside the workspace or uses traversal: ${rawPath}`,
      };
    }
  }

  return { allowed: true };
}