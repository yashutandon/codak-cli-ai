import { redis } from "../infra";

export interface ProjectMemory {
  packageManager?: string;
  framework?: string;
  language?: string;
  testFramework?: string;
  keyPatterns?: string[];
  lastUpdated?: number;
}

const MEMORY_TTL = 60 * 60 * 24 * 7; // 7 days
const memoryKey = (sessionId: string) => `project:memory:${sessionId}`;

export async function getProjectMemory(sessionId: string): Promise<ProjectMemory> {
  try {
    const cached = await redis.get(memoryKey(sessionId));
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

export async function updateProjectMemory(
  sessionId: string,
  updates: Partial<ProjectMemory>
): Promise<void> {
  try {
    const existing = await getProjectMemory(sessionId);
    const merged = { ...existing, ...updates, lastUpdated: Date.now() };
    await redis.setex(memoryKey(sessionId), MEMORY_TTL, JSON.stringify(merged));
  } catch (err) {
    console.error("[Memory] Update failed:", err);
  }
}

export async function buildMemoryContext(sessionId: string): Promise<string> {
  const memory = await getProjectMemory(sessionId);
  if (Object.keys(memory).length === 0) return "";

  const lines: string[] = ["Project context (from previous sessions):"];
  if (memory.packageManager) lines.push(`  - Package manager: ${memory.packageManager}`);
  if (memory.framework)      lines.push(`  - Framework: ${memory.framework}`);
  if (memory.language)       lines.push(`  - Language: ${memory.language}`);
  if (memory.testFramework)  lines.push(`  - Test framework: ${memory.testFramework}`);
  if (memory.keyPatterns?.length) {
    lines.push(`  - Patterns: ${memory.keyPatterns.join(", ")}`);
  }

  return lines.join("\n");
}