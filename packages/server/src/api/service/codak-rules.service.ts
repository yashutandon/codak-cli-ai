import { readFile, stat } from "fs/promises";
import { resolve } from "path";
import { redis } from "../infra";

const RULE_FILENAMES = [".codakrules", ".codak", "codak.md"];
const CACHE_TTL = 60 * 10; // 10 minutes
const MAX_FILE_SIZE = 10 * 1024; // 10KB max

function cacheKey(cwd: string): string {
  return `codak:rules:${Buffer.from(cwd).toString("base64")}`;
}

export async function loadCodakRules(cwd: string): Promise<string | null> {
  const key = cacheKey(cwd);

  // 1. Redis cache check
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      // empty string means "file doesn't exist" — don't hit disk again
      return cached === "" ? null : cached;
    }
  } catch (err) {
    console.error("[codak.md] Redis read failed:", err);
  }

  // 2. Read from disk (check possible filenames)
  for (const filename of RULE_FILENAMES) {
    const filePath = resolve(cwd, filename);
    try {
      const fileStat = await stat(filePath);

      if (fileStat.size > MAX_FILE_SIZE) {
        console.warn(
          `[rules] File ${filename} too large (${(fileStat.size / 1024).toFixed(1)}KB > 10KB limit) — skipping`
        );
        continue;
      }

      const content = await readFile(filePath, "utf-8");
      const trimmed = content.trim();

      if (trimmed) {
        await redis.setex(key, CACHE_TTL, trimmed);
        console.log(`[rules] Loaded ${trimmed.split("\n").length} lines from ${filename}`);
        return trimmed;
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error(`[rules] Read failed for ${filename}:`, err.message);
      }
    }
  }

  // File doesn't exist — cache miss result so we don't hit disk every message
  await redis.setex(key, CACHE_TTL, "");
  return null;
}

export async function invalidateCodakRulesCache(cwd: string): Promise<void> {
  try {
    await redis.del(cacheKey(cwd));
  } catch (err) {
    console.error("[codak.md] Cache invalidation failed:", err);
  }
}