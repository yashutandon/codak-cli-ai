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
];

const PATH_ESCAPE_PATTERNS = [
  /\.\.\//,   // path traversal
  /^\/etc\//,
  /^\/sys\//,
  /^\/proc\//,
];

export function validateToolCall(
  toolName: string,
  args: Record<string, unknown>
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

  // delete_file / write_file / edit_file / read_file — path check
  if (["delete_file", "write_file", "edit_file", "read_file"].includes(toolName)) {
    const path = String(args.path ?? "");
    for (const pattern of PATH_ESCAPE_PATTERNS) {
      if (pattern.test(path)) {
        return {
          allowed: false,
          reason: `Path traversal or sensitive path blocked: ${path}`,
        };
      }
    }
  }

  return { allowed: true };
}