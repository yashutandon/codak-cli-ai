import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import util from "node:util";

const execAsync = util.promisify(exec);

const packages = [
  "packages/shared",
  "packages/database",
  "packages/cli",
  "packages/server",
  "packages/web"
];

async function runCheck() {
  let output = "=== TYPECHECK RESULTS ===\n\n";
  let hasErrors = false;

  for (const pkg of packages) {
    console.log(`Checking ${pkg}...`);
    try {
      if (!fs.existsSync(path.join(pkg, "tsconfig.json"))) {
        output += `[${pkg}] Skipped (no tsconfig.json)\n\n`;
        continue;
      }
      
      const { stdout, stderr } = await execAsync("bunx tsc --noEmit", { cwd: pkg });
      output += `[${pkg}] ✅ PASS\n`;
      if (stdout.trim()) output += `${stdout.trim()}\n`;
      output += "\n";
    } catch (err: any) {
      hasErrors = true;
      output += `[${pkg}] ❌ FAIL\n`;
      if (err.stdout) output += `${err.stdout.trim()}\n`;
      if (err.stderr) output += `${err.stderr.trim()}\n`;
      output += "\n";
    }
  }

  output += `\nSTATUS: ${hasErrors ? "FAILED" : "SUCCESS"}\n`;
  fs.writeFileSync("typecheck-results.txt", output, "utf-8");
  console.log("Check complete. See typecheck-results.txt");
}

runCheck().catch(console.error);
