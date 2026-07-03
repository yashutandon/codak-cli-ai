import { redis } from "../../infra/redis/redis";

const APPROVAL_TTL_SECONDS = 60; // 60s timeout
const POLL_INTERVAL_MS = 250;

export type ApprovalStatus = "pending" | "approved" | "rejected" | "timeout";

const approvalKey = (toolCallId: string) => `approval:${toolCallId}`;

/**
 * Write approval request to Redis and wait for the CLI to respond.
 * Resolves to true if approved, false if rejected or timeout.
 */
export async function waitForApproval(
  toolCallId: string,
  timeoutMs = APPROVAL_TTL_SECONDS * 1000
): Promise<boolean> {
  await redis.setex(approvalKey(toolCallId), APPROVAL_TTL_SECONDS, "pending");

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = await redis.get(approvalKey(toolCallId));

    if (status === "approved") {
      await redis.del(approvalKey(toolCallId));
      return true;
    }
    if (status === "rejected") {
      await redis.del(approvalKey(toolCallId));
      return false;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  await redis.del(approvalKey(toolCallId));
  return false; // Treat timeout as rejection (safe default)
}

/**
 * Called by the approval route when the CLI sends Y/N response.
 */
export async function resolveApproval(
  toolCallId: string,
  approved: boolean
): Promise<void> {
  const key = approvalKey(toolCallId);
  const exists = await redis.exists(key);
  if (exists) {
    await redis.setex(key, APPROVAL_TTL_SECONDS, approved ? "approved" : "rejected");
  }
}
