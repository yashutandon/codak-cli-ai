import { exec } from "child_process";
import { platform } from "os";
import { getToken, saveToken, clearToken, isAccessTokenExpired, getStoredConfig, getRefreshToken } from "./token-store";
import { waitForToken, getRandomPort } from "./auth-server";

const WEB_URL = process.env.CODAK_WEB_URL ?? "http://localhost:3000";
const API_URL = process.env.CODAK_API_URL ?? "http://localhost:3001/api/v1";

function openBrowser(url: string): void {
  const cmd =
    platform() === "win32"
      ? `start "" "${url}"`
      : platform() === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;

  exec(cmd);
}

function buildState(port: number): string {
  const payload = { port, nonce: crypto.randomUUID() };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function ensureAuthenticated(): Promise<string> {
  const existing = await getToken();
  
  if (existing) {
    if (!(await isAccessTokenExpired())) {
      return existing; // Token exists and not expired
    }

    // Token is expired, try to refresh
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });
        
        const json = await res.json();
        if (res.ok && json.success) {
          const newAccessToken = json.data.accessToken;
          const newRefreshToken = json.data.refreshToken ?? refreshToken;
          const config = await getStoredConfig();
          await saveToken(newAccessToken, newRefreshToken, config?.email ?? "");
          return newAccessToken;
        }
      } catch (err) {
        // Refresh failed, fall through to browser login
      }
    }
  }

  const port = getRandomPort();
  const state = buildState(port);
  const loginUrl = `${WEB_URL}/login?state=${encodeURIComponent(state)}`;

  openBrowser(loginUrl);

  const { accessToken, refreshToken } = await waitForToken(port);
  await saveToken(accessToken, refreshToken, "");

  return accessToken;
}

export { getToken, clearToken, getStoredConfig };