import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { ChatShell } from "../components/chat-shell/shell";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ErrorMessage } from "../components/messages/error-message";
import { getSessionById } from "../clients/create-session/session.api";
import { sendMessage, type ToolCall, type ToolResult, type ApprovalRequest, sendApproval } from "../clients/message/message.api";
import type { Session, Message } from "../clients/create-session/session.types";
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@codak/shared";
import type { ToolCallWithResult } from "../components/messages/bot-message";
import { ToolApprovalPrompt } from "../components/tool-approval-prompt";
import { parseImagesFromText } from "../utils/image-parser";

const sessionLocationSchema = z.object({
  session: z.custom<Session>(
    (val) => val != null && typeof val === "object" && "id" in val
  ),
  model: z.string().optional(),
});

type Mode = "BUILD" | "PLAN";

type StreamingTurn = {
  content: string;
  toolCalls: ToolCallWithResult[];
  startedAt: number;
  mode: Mode;
};

type MessageWithDuration = Message & { durationMs?: number };

export function Chat() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const prefetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state, id]);

  const [session, setSession] = useState<Session | null>(prefetched?.session ?? null);
  const [messages, setMessages] = useState<MessageWithDuration[]>(prefetched?.session?.messages ?? []);
  const [streamingTurn, setStreamingTurn] = useState<StreamingTurn | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("BUILD");
  const [model, setModel] = useState<SupportedChatModelId>(
    (prefetched?.model as SupportedChatModelId) ?? DEFAULT_CHAT_MODEL_ID
  );
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);

  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    setSession(prefetched?.session ?? null);
    setMessages(prefetched?.session?.messages ?? []);
    setStreamingTurn(null);
    setIsStreaming(false);
    setError(null);
    setPendingApproval(null);
    setModel((prefetched?.model as SupportedChatModelId) ?? DEFAULT_CHAT_MODEL_ID);
    autoTriggeredRef.current = false;
  }, [id]);

  useEffect(() => {
    if (prefetched?.session) {
      setSession(prefetched.session);
      setMessages(prefetched.session.messages);
      return;
    }
    if (!id) return;
    let ignore = false;
    const fetchSession = async () => {
      try {
        const data = await getSessionById(id);
        if (ignore) return;
        setSession(data);
        setMessages(data.messages);
      } catch {
        if (ignore) return;
        navigate("/", { replace: true });
      }
    };
    fetchSession();
    return () => { ignore = true; };
  }, [id, prefetched, navigate]);

  const streamAiResponse = useCallback(async (
    sessionId: string,
    content: string,
    images: string[] | undefined,
    currentMode: Mode,
    currentModel: SupportedChatModelId
  ) => {
    const startedAt = Date.now();
    setStreamingTurn({ content: "", toolCalls: [], startedAt, mode: currentMode });
    setIsStreaming(true);
    setError(null);

    let accText = "";

    await sendMessage(
      sessionId,
      content,
      images,
      currentModel,
      currentMode,
      (chunk) => {
        accText += chunk;
        setStreamingTurn((prev) =>
          prev
            ? { ...prev, content: accText }
            : { content: accText, toolCalls: [], startedAt, mode: currentMode }
        );
      },
      (toolCall: ToolCall) => {
        if (currentMode === "PLAN") return;
        setStreamingTurn((prev) => {
          const base = prev ?? { content: accText, toolCalls: [], startedAt, mode: currentMode };
          return { ...base, toolCalls: [...base.toolCalls, { ...toolCall, pending: true }] };
        });
      },
      (toolResult: ToolResult) => {
        if (currentMode === "PLAN") return;
        setStreamingTurn((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            toolCalls: prev.toolCalls.map((tc) =>
              tc.toolCallId === toolResult.toolCallId
                ? { ...tc, result: toolResult.result, pending: false }
                : tc
            ),
          };
        });
      },
      (usage?: { promptTokens: number; completionTokens: number }) => {
        const durationMs = Date.now() - startedAt;
        
        let tokenUsage = undefined;
        if (usage) {
           const totalTokens = usage.promptTokens + usage.completionTokens;
           let costUsd = 0;
           if (currentModel.includes("gpt-4o")) {
             costUsd = (usage.promptTokens * 5.0 / 1000000) + (usage.completionTokens * 15.0 / 1000000);
           } else if (currentModel.includes("claude-3-5")) {
             costUsd = (usage.promptTokens * 3.0 / 1000000) + (usage.completionTokens * 15.0 / 1000000);
           }
           tokenUsage = { ...usage, totalTokens, costUsd };
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ASSISTANT",
            content: accText,
            title: "",
            status: "COMPLETE",
            part: tokenUsage,
            mode: currentMode,
            model: currentModel,
            duration: null,
            createdAt: new Date().toISOString(),
            sessionId,
            durationMs,
          } as MessageWithDuration,
        ]);
        setStreamingTurn(null);
        setIsStreaming(false);
      },
      (err) => {
        setError(err);
        setStreamingTurn(null);
        setIsStreaming(false);
      },
      // Approval handler
      (request: ApprovalRequest) => {
        setPendingApproval(request);
      }
    );
  }, []);

  const handleSubmit = useCallback(async (text: string) => {
    if (!session || isStreaming) return;

    const { processedText, images } = parseImagesFromText(text);

    const userMsg: MessageWithDuration = {
      id: crypto.randomUUID(),
      role: "USER",
      content: processedText || (images.length > 0 ? "Attached Image(s)" : text),
      title: "",
      status: "COMPLETE",
      part: null,
      mode,
      model,
      duration: null,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
    };
    setMessages((prev) => [...prev, userMsg]);
    await streamAiResponse(session.id, processedText, images.length > 0 ? images : undefined, mode, model);
  }, [session, isStreaming, streamAiResponse, mode, model]);

  useEffect(() => {
    if (!session || autoTriggeredRef.current || isStreaming) return;
    const hasAssistant = messages.some((m) => m.role === "ASSISTANT");
    if (hasAssistant) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "USER") return;
    autoTriggeredRef.current = true;
    streamAiResponse(session.id, lastMsg.content, undefined, mode, model);
  }, [session, messages, isStreaming, streamAiResponse, mode, model]);

  if (!session) {
    return <ChatShell onSubmit={() => { }} inputDisabled loading />;
  }

  return (
    <ChatShell
      onSubmit={handleSubmit}
      inputDisabled={isStreaming}
      loading={isStreaming}
      mode={mode}
      onModeChange={setMode}
      model={model}
      onModelChange={setModel}
      sessionId={session.id}
      sessionCwd={session.cwd}
    >
      {messages.map((msg) =>
        msg.role === "USER" ? (
          <UserMessage key={msg.id} message={msg.content} />
        ) : (
          <BotMessage
            key={msg.id}
            content={msg.content}
            model={msg.model}
            mode={msg.mode as Mode}
            durationMs={(msg as MessageWithDuration).durationMs}
            tokenUsage={
              msg.part && typeof msg.part === "object" && "totalTokens" in (msg.part as object)
                ? (msg.part as { promptTokens: number; completionTokens: number; totalTokens: number; costUsd?: number })
                : undefined
            }
          />
        )
      )}
      {streamingTurn !== null && (
        <BotMessage
          content={streamingTurn.content}
          model={model}
          mode={streamingTurn.mode}
          toolCalls={streamingTurn.toolCalls}
          streaming={true}
        />
      )}
      {error && <ErrorMessage message={error} />}
      {pendingApproval && session && (
        <ToolApprovalPrompt
          toolName={pendingApproval.toolName}
          args={pendingApproval.args}
          onApprove={() => {
            const req = pendingApproval;
            setPendingApproval(null);
            sendApproval(session.id, req.toolCallId, true).catch(console.error);
          }}
          onReject={() => {
            const req = pendingApproval;
            setPendingApproval(null);
            sendApproval(session.id, req.toolCallId, false).catch(console.error);
          }}
        />
      )}
    </ChatShell>
  );
}