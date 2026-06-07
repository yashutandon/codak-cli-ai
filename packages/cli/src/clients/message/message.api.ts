import { getToken } from "../../auth";

const BASE_URL = "http://localhost:3001/api/v1";

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function sendMessage(
  sessionId: string,
  content: string,
  model: string,
  mode: "BUILD" | "PLAN" = "BUILD",
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ content, model, mode }),
    });

    if (!res.ok) {
      onError(`HTTP ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError("No response body");
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.type === "text-delta") onChunk(json.text);
          if (json.type === "done") {
            onDone();
            return;
          }
          if (json.type === "error") {
            onError(json.message ?? "Unknown error");
            return;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : "Network error");
  }
}