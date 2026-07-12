import { exec } from "child_process";
import { platform } from "os";
import { getToken, saveToken, clearToken, isAccessTokenExpired } from "./token-store";
import { waitForToken, getRandomPort } from "./auth-server";

const WEB_URL = process.env.CODAK_WEB_URL ?? "http://localhost:3000";

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
  // Token exists and not expired — return immediately
  if (existing && !(await isAccessTokenExpired())) return existing;

  const port = getRandomPort();
  const state = buildState(port);
  const loginUrl = `${WEB_URL}/login?state=${encodeURIComponent(state)}`;

  openBrowser(loginUrl);

  const { accessToken, refreshToken } = await waitForToken(port);
  await saveToken(accessToken, refreshToken, "");

  return accessToken;
}

export { getToken, clearToken };