import type { ApiResponse, CreateSessionPayload, Session } from "./session.types";

const BASE_URL = "http://localhost:3001/api/v1";

export async function createSession(
  payload: CreateSessionPayload
): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json: ApiResponse<Session> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`
    );
  }

  return json.data;
}

export async function getSessionById(id: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const json: ApiResponse<Session> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`
    );
  }

  return json.data;
}