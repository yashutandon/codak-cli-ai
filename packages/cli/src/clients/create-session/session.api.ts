import type { ApiResponse, CreateSessionPayload, Session } from "./session.types";
import { getToken } from "../../auth";

const BASE_URL = "http://localhost:3001/api/v1";

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAllSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  const json: ApiResponse<Session[]> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`
    );
  }

  return json.data;
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: await getAuthHeaders(),
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
    headers: await getAuthHeaders(),
  });

  const json: ApiResponse<Session> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`
    );
  }

  return json.data;
}

export async function updateSessionCwd(
  id: string,
  cwd: string
): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ cwd }),
  });

  const json: ApiResponse<Session> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`
    );
  }

  return json.data;
}