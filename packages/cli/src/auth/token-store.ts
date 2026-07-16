import { join } from "path";
import { homedir } from "os";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";

const CONFIG_DIR = join(homedir(), ".codak");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;  // ISO string — when accessToken expires
  email: string;
  createdAt: string;
}

export async function saveToken(
  accessToken: string,
  refreshToken: string,
  email: string,
  expiresInMs = 15 * 60 * 1000 // 15 minutes default
): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const config: Config = {
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    email,
    createdAt: new Date().toISOString(),
  };
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export async function getToken(): Promise<string | null> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const config: Config = JSON.parse(raw);
    return config.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const config: Config = JSON.parse(raw);
    return config.refreshToken ?? null;
  } catch {
    return null;
  }
}

export async function getStoredConfig(): Promise<Partial<Config> | null> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Partial<Config>;
  } catch {
    return null;
  }
}

export async function isAccessTokenExpired(): Promise<boolean> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const config: Config = JSON.parse(raw);
    if (!config.expiresAt) return true;
    // Consider expired 60s before actual expiry (buffer)
    return Date.now() >= new Date(config.expiresAt).getTime() - 60_000;
  } catch {
    return true;
  }
}

/**
 * Removes the stored config file entirely.
 * Next call to getToken() will return null → CLI will prompt re-login.
 */
export async function clearToken(): Promise<void> {
  try {
    await unlink(CONFIG_FILE);
  } catch {
    // File already gone — that's fine
  }
}