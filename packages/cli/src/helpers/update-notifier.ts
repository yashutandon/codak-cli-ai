/**
 * Silent update notifier.
 * Checks npm registry for latest version and prints a banner if behind.
 * Fire-and-forget — does NOT block startup.
 */

const PACKAGE_NAME = "codak-cli";
const NPM_TIMEOUT_MS = 2000;

function getCurrentVersion(): string {
  try {
    // Resolve relative to this file (dist/src/helpers/update-notifier.js -> package.json)
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function semverGt(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const [lM, lm, lp] = parse(latest);
  const [cM, cm, cp] = parse(current);
  if (lM !== cM) return (lM ?? 0) > (cM ?? 0);
  if (lm !== cm) return (lm ?? 0) > (cm ?? 0);
  return (lp ?? 0) > (cp ?? 0);
}

export async function checkForUpdate(): Promise<void> {
  try {
    const current = getCurrentVersion();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NPM_TIMEOUT_MS);

    const res = await fetch(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return;

    const data = await res.json() as { version?: string };
    const latest = data.version;

    if (!latest || !semverGt(latest, current)) return;

    // Print banner to stderr so it doesn't corrupt TTY rendering
    process.stderr.write(
      `\n  ╔════════════════════════════════════════════════╗\n` +
      `  ║  🚀 Codak update available: ${current} → ${latest}  \n` +
      `  ║  Run: npm i -g ${PACKAGE_NAME} to update         ║\n` +
      `  ╚════════════════════════════════════════════════╝\n\n`
    );
  } catch {
    // Silently ignore — update check must never crash startup
  }
}
