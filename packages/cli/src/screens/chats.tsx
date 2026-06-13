import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { ChatShell } from "../components/chat-shell/shell";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ErrorMessage } from "../components/messages/error-message";
import { getSessionById } from "../clients/create-session/session.api";
import { sendMessage, type ToolCall, type ToolResult } from "../clients/message/message.api";
import type { Session, Message } from "../clients/create-session/session.types";
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@codak/shared";
import type { ToolCallWithResult } from "../components/messages/bot-message";

const sessionLocationSchema = z.object({
  session: z.custom<Session>(
    (val) => val != null && typeof val === "object" && "id" in val
  ),
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
  const [model, setModel] = useState<SupportedChatModelId>(DEFAULT_CHAT_MODEL_ID);

  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    setSession(prefetched?.session ?? null);
    setMessages(prefetched?.session?.messages ?? []);
    setStreamingTurn(null);
    setIsStreaming(false);
    setError(null);
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
      () => {
        const durationMs = Date.now() - startedAt;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ASSISTANT",
            content: accText,
            title: "",
            status: "COMPLETE",
            part: null,
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
      }
    );
  }, []);

  const handleSubmit = useCallback(async (text: string) => {
    if (!session || isStreaming) return;
    const userMsg: MessageWithDuration = {
      id: crypto.randomUUID(),
      role: "USER",
      content: text,
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
    await streamAiResponse(session.id, text, mode, model);
  }, [session, isStreaming, streamAiResponse, mode, model]);

  useEffect(() => {
    if (!session || autoTriggeredRef.current || isStreaming) return;
    const hasAssistant = messages.some((m) => m.role === "ASSISTANT");
    if (hasAssistant) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "USER") return;
    autoTriggeredRef.current = true;
    streamAiResponse(session.id, lastMsg.content, mode, model);
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
    </ChatShell>
  );
}