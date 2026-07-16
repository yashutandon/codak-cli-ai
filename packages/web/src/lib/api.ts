/**
 * api.ts — Typed API client for the web dashboard.
 * All calls include Authorization: Bearer <token> from localStorage.
 */

import type { SessionDto, Message } from "../types/api";
import { getAccessToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message ?? `API error ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<SessionDto[]> {
  return apiFetch<SessionDto[]>("/api/v1/session");
}

export async function getSession(id: string): Promise<SessionDto> {
  return apiFetch<SessionDto>(`/api/v1/session/${id}`);
}

export async function createSession(body: {
  title: string;
  cwd?: string;
}): Promise<SessionDto> {
  return apiFetch<SessionDto>("/api/v1/session", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/session/${id}`, { method: "DELETE" });
}

export async function getIndexingStatus(
  sessionId: string
): Promise<"pending" | "indexing" | "done" | "failed"> {
  const data = await apiFetch<{ status: string }>(
    `/api/v1/session/${sessionId}/indexing-status`
  );
  return data.status as "pending" | "indexing" | "done" | "failed";
}

// ── Messages — SSE streaming ──────────────────────────────────────────────────

export interface SendMessageOptions {
  content: string;
  model: string;
  mode: "BUILD" | "PLAN";
}

export interface SSEEvent {
  type:
    | "text-delta"
    | "tool-call"
    | "tool-result"
    | "reasoning-delta"
    | "done"
    | "error";
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Sends a message and returns an async generator that yields SSE events.
 * Usage:
 *   for await (const event of sendMessageStream(sessionId, opts)) { ... }
 */
export async function* sendMessageStream(
  sessionId: string,
  opts: SendMessageOptions
): AsyncGenerator<SSEEvent> {
  const token = getAccessToken();

  const res = await fetch(`${BASE}/api/v1/message/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(opts),
  });

  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          yield JSON.parse(raw) as SSEEvent;
        } catch {
          // ignore malformed frames
        }
      }
    }
  }
}
