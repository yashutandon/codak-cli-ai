import { appendFileSync } from "fs";
import { apiFetch, BASE_URL } from "../api";
import { getToken, clearToken, ensureAuthenticated } from "../../auth";

function log(msg: string) {
  appendFileSync("C:/tmp/codak-debug.log", msg + "\n");
}

export type ToolCall = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  result: string;
};

export async function sendMessage(
  sessionId: string,
  content: string,
  model: string,
  mode: "BUILD" | "PLAN" = "BUILD",
  onChunk: (text: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
  onToolResult: (toolResult: ToolResult) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    log(`[sendMessage] called — sessionId=${sessionId} content=${content.slice(0, 30)}`);

    let res = await apiFetch(`/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, model, mode }),
    });

    // 401 already handled by apiFetch — but double check
    if (res.status === 401) {
      log(`[sendMessage] 401 after retry — re-authenticating`);
      await clearToken();
      await ensureAuthenticated();
      const token = await getToken();
      res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content, model, mode }),
      });
    }

    log(`[sendMessage] response status=${res.status}`);

    if (!res.ok) {
      log(`[sendMessage] not ok — ${res.status}`);
      onError(`HTTP ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      log(`[sendMessage] no reader`);
      onError("No response body");
      return;
    }

    let buffer = "";
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        log(`[sendMessage] reader done — chunks=${chunkCount} buffer="${buffer.slice(0, 50)}"`);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const json = JSON.parse(raw);
          log(`[event] type=${json.type}`);

          if (json.type === "text-delta") {
            chunkCount++;
            onChunk(json.text ?? "");
          } else if (json.type === "tool-call") {
            onToolCall({
              toolCallId: json.toolCallId,
              toolName: json.toolName,
              args: json.args ?? {},
            });
          } else if (json.type === "tool-result") {
            onToolResult({
              toolCallId: json.toolCallId,
              result: String(json.result ?? ""),
            });
          } else if (json.type === "done") {
            log(`[sendMessage] DONE — chunks=${chunkCount}`);
            onDone();
            return;
          } else if (json.type === "error") {
            log(`[sendMessage] ERROR — ${json.message}`);
            onError(json.message ?? "Unknown error");
            return;
          }
        } catch (e) {
          log(`[parse error] raw="${raw.slice(0, 80)}" err=${e}`);
        }
      }
    }

    log(`[sendMessage] loop ended without done event`);
  } catch (err) {
    log(`[sendMessage] catch — ${err instanceof Error ? err.message : String(err)}`);
    onError(err instanceof Error ? err.message : "Network error");
  }
}