import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { useTheme } from "../providers/theme";
import { ChatShell } from "../components/chat-shell/shell";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ErrorMessage } from "../components/messages/error-message";
import { getSessionById } from "../clients/create-session/session.api";
import { sendMessage } from "../clients/message/message.api";
import type { Session, Message } from "../clients/create-session/session.types";
import { DEFAULT_CHAT_MODEL_ID } from "@codak/shared";

const sessionLocationSchema = z.object({
  session: z.custom<Session>(
    (val) => val != null && typeof val === "object" && "id" in val
  ),
});

const MODEL = DEFAULT_CHAT_MODEL_ID;

export function Chat() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const prefetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const [session, setSession] = useState<Session | null>(
    prefetched?.session ?? null
  );
  const [messages, setMessages] = useState<Message[]>(
    prefetched?.session?.messages ?? []
  );
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoTriggeredRef = useRef(false);

  // ── Fetch session if not prefetched ──────────────────────────────────────
  useEffect(() => {
    if (prefetched?.session) return;

    setSession(null);
    setError(null);
    autoTriggeredRef.current = false;

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

  // ── Stream AI response only (no user message added to state) ─────────────
  const streamAiResponse = useCallback(async (sessionId: string, content: string) => {
    setStreamingContent("");
    setIsStreaming(true);
    setError(null);

    let accumulated = "";

    await sendMessage(
      sessionId,
      content,
      MODEL,
      "BUILD",
      (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      },
      () => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ASSISTANT",
            content: accumulated,
            title: "",
            status: "COMPLETE",
            part: null,
            mode: "BUILD",
            model: MODEL,
            duration: null,
            createdAt: new Date().toISOString(),
            sessionId,
          } as Message,
        ]);
        setStreamingContent(null);
        setIsStreaming(false);
      },
      (err) => {
        setError(err);
        setStreamingContent(null);
        setIsStreaming(false);
      }
    );
  }, []);

  // ── User submits a new message ────────────────────────────────────────────
  const handleSubmit = useCallback(async (text: string) => {
    if (!session || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "USER",
      content: text,
      title: "",
      status: "COMPLETE",
      part: null,
      mode: "BUILD",
      model: MODEL,
      duration: null,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
    };

    setMessages((prev) => [...prev, userMsg]);
    await streamAiResponse(session.id, text);
  }, [session, isStreaming, streamAiResponse]);

  // ── Auto-trigger: respond to first unanswered USER message ───────────────
  useEffect(() => {
    if (!session || autoTriggeredRef.current || isStreaming) return;

    const hasAssistant = messages.some((m) => m.role === "ASSISTANT");
    if (hasAssistant) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "USER") return;

    autoTriggeredRef.current = true;
    streamAiResponse(session.id, lastMsg.content);
  }, [session, messages, isStreaming, streamAiResponse]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!session) {
    return <ChatShell onSubmit={() => {}} inputDisabled loading />;
  }

  return (
    <ChatShell
      onSubmit={handleSubmit}
      inputDisabled={isStreaming}
      loading={isStreaming}
    >
      {messages.map((msg) =>
        msg.role === "USER" ? (
          <UserMessage key={msg.id} message={msg.content} />
        ) : (
          <BotMessage key={msg.id} content={msg.content} model={msg.model} />
        )
      )}

      {streamingContent !== null && (
        <BotMessage content={streamingContent} model={MODEL} />
      )}

      {error && <ErrorMessage message={error} />}
    </ChatShell>
  );
}