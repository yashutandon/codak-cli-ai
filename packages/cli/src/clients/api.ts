import { getToken, clearToken, ensureAuthenticated } from "../auth";

export const BASE_URL = process.env.CODAK_API_URL ?? "http://localhost:3001/api/v1";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    await clearToken();
    await ensureAuthenticated();
    const newToken = await getToken();
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  }

  return res;
}