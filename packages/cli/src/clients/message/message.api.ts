import { apiFetch, BASE_URL } from "../api";
import { getToken, clearToken, ensureAuthenticated } from "../../auth";

export type ToolCall = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  result: string;
};

export type ApprovalRequest = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export async function sendMessage(
  sessionId: string,
  content: string,
  images: string[] | undefined,
  model: string,
  mode: "BUILD" | "PLAN" = "BUILD",
  onChunk: (text: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
  onToolResult: (toolResult: ToolResult) => void,
  onDone: (usage?: { promptTokens: number; completionTokens: number }) => void,
  onError: (err: string) => void,
  onApprovalRequired?: (request: ApprovalRequest) => void
): Promise<void> {
  try {
    let res = await apiFetch(`/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, model, mode, images }),
    });

    // 401 already handled by apiFetch — but double check
    if (res.status === 401) {
      await clearToken();
      await ensureAuthenticated();
      const token = await getToken();
      res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content, model, mode, images }),
      });
    }

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

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const json = JSON.parse(raw);

          if (json.type === "text-delta") {
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
          } else if (json.type === "tool-approval-required") {
            // Notify the UI — response will be sent separately
            onApprovalRequired?.({
              toolCallId: json.toolCallId,
              toolName: json.toolName,
              args: json.args ?? {},
            });
          } else if (json.type === "done") {
            onDone(json.usage);
            return;
          } else if (json.type === "error") {
            onError(json.message ?? "Unknown error");
            return;
          }
        } catch {
          // Ignore parse errors for malformed SSE lines
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : "Network error");
  }
}

/**
 * Send the user's approval or rejection back to the server.
 */
export async function sendApproval(
  sessionId: string,
  toolCallId: string,
  approved: boolean
): Promise<void> {
  await apiFetch(`/sessions/${sessionId}/messages/approve`, {
    method: "POST",
    body: JSON.stringify({ toolCallId, approved }),
  });
}