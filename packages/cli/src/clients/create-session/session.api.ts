import type { ApiResponse, CreateSessionPayload, Session } from "./session.types";
import { apiFetch } from "../api";

export async function getAllSessions(): Promise<Session[]> {
  const res = await apiFetch("/sessions");
  const json: ApiResponse<Session[]> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}

export async function createSession(payload: CreateSessionPayload): Promise<Session> {
  const res = await apiFetch("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<Session> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}

export async function getSessionById(id: string): Promise<Session> {
  const res = await apiFetch(`/sessions/${id}`);
  const json: ApiResponse<Session> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}

export async function updateSessionCwd(id: string, cwd: string): Promise<Session> {
  const res = await apiFetch(`/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ cwd }),
  });
  const json: ApiResponse<Session> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}