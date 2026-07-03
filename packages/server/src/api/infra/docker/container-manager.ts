import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const DOCKER_IMAGE = "node:20-alpine";
const CONTAINER_PREFIX = "codak-session";
const CONTAINER_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const CMD_TIMEOUT_MS = 30_000;

const activeContainers = new Map<string, {
  containerId: string;
  createdAt: number;
  timer: NodeJS.Timeout;
}>();

export async function initContainerManager() {
  try {
    const isAvailable = await isDockerAvailable();
    if (!isAvailable) return;

    const { stdout } = await execAsync(`docker ps -a -q --filter name=${CONTAINER_PREFIX}`);
    const containerIds = stdout.trim().split("\n").filter(Boolean);
    if (containerIds.length > 0) {
      console.log(`[Docker] Cleaning up ${containerIds.length} orphaned containers...`);
      await execAsync(`docker rm -f ${containerIds.join(" ")}`);
    }
  } catch (err) {
    console.error(`[Docker] Cleanup failed:`, err);
  }
}

export async function getOrCreateContainer(
  sessionId: string,
  cwd: string
): Promise<string> {
  const existing = activeContainers.get(sessionId);
  if (existing) {
    // Reset timeout
    clearTimeout(existing.timer);
    existing.timer = scheduleDestroy(sessionId);
    return existing.containerId;
  }

  // Normalize path for Docker on Windows
  const mountPath = normalizePath(cwd);

  const containerName = `${CONTAINER_PREFIX}-${sessionId.slice(0, 8)}`;

  // Remove if exists (crashed container)
  await execAsync(`docker rm -f ${containerName}`).catch(() => {});

  const { stdout } = await execAsync(
    `docker run -d --rm --name ${containerName} ` +
    `--memory=512m --cpus=1 ` +
    `--network=none ` +
    `--security-opt no-new-privileges ` +
    `-v "${mountPath}:/workspace" ` +
    `-w /workspace ` +
    `${DOCKER_IMAGE} tail -f /dev/null`,
    { timeout: 120_000 }
  );

  const containerId = stdout.trim();

  const timer = scheduleDestroy(sessionId);
  activeContainers.set(sessionId, { containerId: containerName, createdAt: Date.now(), timer });

  console.log(`[Docker] Container created for session ${sessionId}: ${containerName}`);
  return containerName;
}

export async function runInContainer(
  sessionId: string,
  cwd: string,
  command: string
): Promise<string> {
  const containerName = await getOrCreateContainer(sessionId, cwd);

  try {
    const { stdout, stderr } = await execAsync(
      `docker exec ${containerName} sh -c ${JSON.stringify(command)}`,
      { timeout: CMD_TIMEOUT_MS }
    );

    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    return output || "(no output)";
  } catch (err: any) {
    if (err.killed) throw new Error(`Command timed out after ${CMD_TIMEOUT_MS / 1000}s`);
    const output = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`Command failed: ${output || err.message}`);
  }
}

export async function destroyContainer(sessionId: string): Promise<void> {
  const entry = activeContainers.get(sessionId);
  if (!entry) return;

  clearTimeout(entry.timer);
  activeContainers.delete(sessionId);

  try {
    await execAsync(`docker rm -f ${entry.containerId}`, { timeout: 10_000 });
    console.log(`[Docker] Container destroyed for session ${sessionId}`);
  } catch (err) {
    console.error(`[Docker] Failed to destroy container:`, err);
  }
}

export function isDockerAvailable(): Promise<boolean> {
  return execAsync("docker info", { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
}

function scheduleDestroy(sessionId: string): NodeJS.Timeout {
  return setTimeout(() => {
    destroyContainer(sessionId);
    console.log(`[Docker] Container auto-destroyed (timeout): ${sessionId}`);
  }, CONTAINER_TIMEOUT_MS);
}

function normalizePath(path: string): string {
  // Windows path → Docker path
  // C:\Users\yashu\project → /c/Users/yashu/project
  return path.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
}