import { join } from "path";
import { homedir } from "os";
import { readFile, writeFile, mkdir } from "fs/promises";

const CONFIG_DIR = join(homedir(), ".codak");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  accessToken: string;
  email: string;
  createdAt: string;
}

export async function saveToken(token: string, email: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const config: Config = {
    accessToken: token,
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

export async function clearToken(): Promise<void> {
  try {
    await writeFile(CONFIG_FILE, JSON.stringify({}), "utf-8");
  } catch {
    // ignore
  }
}