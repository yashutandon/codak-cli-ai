import { access } from "fs/promises";
import { join } from "path";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

interface PackageManagerInfo {
  name: PackageManager;
  runScript: (script: string) => string;
  exec: (pkg: string) => string;
  install: string;
}

const PM_CONFIG: Record<PackageManager, PackageManagerInfo> = {
  bun: {
    name: "bun",
    runScript: (s) => `bun run ${s}`,
    exec: (pkg) => `bunx ${pkg}`,
    install: "bun install",
  },
  pnpm: {
    name: "pnpm",
    runScript: (s) => `pnpm run ${s}`,
    exec: (pkg) => `pnpx ${pkg}`,
    install: "pnpm install",
  },
  yarn: {
    name: "yarn",
    runScript: (s) => `yarn ${s}`,
    exec: (pkg) => `yarn dlx ${pkg}`,
    install: "yarn install",
  },
  npm: {
    name: "npm",
    runScript: (s) => `npm run ${s}`,
    exec: (pkg) => `npx ${pkg}`,
    install: "npm install",
  },
};

const LOCKFILE_MAP: Array<{ file: string; pm: PackageManager }> = [
  { file: "bun.lockb",          pm: "bun"  },
  { file: "bun.lock",           pm: "bun"  },
  { file: "pnpm-lock.yaml",     pm: "pnpm" },
  { file: "yarn.lock",          pm: "yarn" },
  { file: "package-lock.json",  pm: "npm"  },
];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(cwd: string): Promise<PackageManagerInfo> {
  for (const { file, pm } of LOCKFILE_MAP) {
    if (await fileExists(join(cwd, file))) {
      return PM_CONFIG[pm];
    }
  }
  return PM_CONFIG["npm"];
}