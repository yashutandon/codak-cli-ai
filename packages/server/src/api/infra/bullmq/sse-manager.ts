import type { Response } from "express";

type SseClient = {
  res: Response;
};

/**
 * In-memory store of active SSE connections.
 * Key: jobId (unique per AI request)
 * Value: Express Response object
 *
 * Note: This works for single-server deployments.
 * For multi-instance scaling → replace with Redis pub/sub.
 */
const clients = new Map<string, SseClient>();

export const sseManager = {
  register(jobId: string, res: Response): void {
    clients.set(jobId, { res });
  },

  send(jobId: string, data: object): void {
    const client = clients.get(jobId);
    if (!client) return;
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  },

  done(jobId: string): void {
    const client = clients.get(jobId);
    if (!client) return;
    client.res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    client.res.end();
    clients.delete(jobId);
  },

  error(jobId: string, message: string): void {
    const client = clients.get(jobId);
    if (!client) return;
    client.res.write(
      `data: ${JSON.stringify({ type: "error", message })}\n\n`
    );
    client.res.end();
    clients.delete(jobId);
  },

  remove(jobId: string): void {
    clients.delete(jobId);
  },

  has(jobId: string): boolean {
    return clients.has(jobId);
  },

  size(): number {
    return clients.size;
  },
};