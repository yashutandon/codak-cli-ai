import {
  getToken,
  getRefreshToken,
  isAccessTokenExpired,
  saveToken,
  clearToken,
} from "../auth/token-store";
import { ensureAuthenticated } from "../auth";

export const BASE_URL = process.env.CODAK_API_URL ?? "http://localhost:3001/api/v1";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Silently refresh accessToken using stored refreshToken.
 * Returns the new accessToken, or null if refresh failed.
 */
async function silentRefresh(): Promise<string | null> {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await clearToken();
        return null;
      }

      const json = await res.json() as {
        success: boolean;
        data: { accessToken: string; refreshToken: string };
      };

      if (!json.success) {
        await clearToken();
        return null;
      }

      const { accessToken, refreshToken: newRefreshToken } = json.data;
      await saveToken(accessToken, newRefreshToken, "");
      return accessToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Central fetch wrapper:
 * 1. Proactively refreshes if token is within 60s of expiry
 * 2. Retries once on 401 using refreshToken (handles server-side expiry)
 * 3. Falls back to full re-auth if refresh fails
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<Response> {
  // Proactive refresh before the token expires
  if (await isAccessTokenExpired()) {
    await silentRefresh();
  }

  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // On 401: try one silent refresh, then retry the request
  if (res.status === 401 && !retried) {
    const newToken = await silentRefresh();
    if (newToken) {
      return apiFetch(path, options, true);
    }

    // Refresh failed — force full re-auth
    await clearToken();
    await ensureAuthenticated();
    return apiFetch(path, options, true);
  }

  return res;
}