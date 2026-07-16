"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { getSessions, getSession, sendMessageStream } from "@/lib/api";
import type { SessionDto, Message } from "@/types/api";
import type { SSEEvent } from "@/lib/api";
import Sidebar from "@/components/chat/Sidebar";
import MessageThread from "@/components/chat/MessageThread";
import ChatInput from "@/components/chat/ChatInput";
import NewSessionModal from "@/components/chat/NewSessionModal";
import { FullPageSpinner } from "@/components/common/loader";
import { FolderIcon } from "lucide-react";

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [session, setSession] = useState<SessionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [sessionsData, sessionData] = await Promise.all([
        getSessions(),
        getSession(sessionId),
      ]);
      setSessions(sessionsData);
      setSession(sessionData);
    } catch {
      router.replace("/chat");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleSend = useCallback(
    async (content: string, model: string, mode: "BUILD" | "PLAN") => {
      if (isStreaming || !session) return;

      // Optimistically add user message to UI
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content,
        mode,
        model,
        status: "COMPLETE",
        title: "",
        part: null,
        duration: null,
        createdAt: new Date().toISOString(),
        sessionId,
      };

      setSession((prev) =>
        prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev
      );
      setIsStreaming(true);
      setStreamingContent("");
      setToolCalls([]);

      try {
        let fullText = "";

        for await (const event of sendMessageStream(sessionId, {
          content,
          model,
          mode,
        })) {
          handleSSEEvent(event, (text) => {
            fullText += text;
            setStreamingContent(fullText);
          });

          if (event.type === "done") break;
        }

        // Reload session to get the saved assistant message from DB
        const updated = await getSession(sessionId);
        setSession(updated);
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setToolCalls([]);
      }
    },
    [isStreaming, session, sessionId]
  );

  function handleSSEEvent(
    event: SSEEvent,
    onText: (text: string) => void
  ) {
    switch (event.type) {
      case "text-delta":
        if (event.text) onText(event.text);
        break;

      case "tool-call":
        if (event.toolCallId && event.toolName) {
          setToolCalls((prev) => [
            ...prev,
            {
              toolCallId: event.toolCallId!,
              toolName: event.toolName!,
              args: event.args ?? {},
            },
          ]);
        }
        break;

      case "tool-result":
        if (event.toolCallId) {
          setToolCalls((prev) =>
            prev.map((tc) =>
              tc.toolCallId === event.toolCallId
                ? { ...tc, result: event.result }
                : tc
            )
          );
        }
        break;
    }
  }

  if (loading) return <FullPageSpinner />;
  if (!session) return null;

  return (
    <>
      <Sidebar
        sessions={sessions}
        onNewChat={() => setShowModal(true)}
        onSessionDeleted={(id) => {
          setSessions((s) => s.filter((x) => x.id !== id));
          if (id === sessionId) router.push("/chat");
        }}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-white/80 truncate">{session.title}</h1>
            {session.cwd && (
              <p className="text-[10px] text-white/25 font-mono truncate flex items-center gap-1 mt-0.5">
                <FolderIcon size={9} />
                {session.cwd}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <MessageThread
          messages={session.messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          toolCalls={toolCalls}
        />

        {/* Input */}
        <ChatInput
          sessionId={sessionId}
          disabled={isStreaming}
          onSend={handleSend}
        />
      </main>

      {showModal && (
        <NewSessionModal
          onClose={() => setShowModal(false)}
          onCreated={(newSession) => {
            setSessions((s) => [newSession, ...s]);
            setShowModal(false);
            router.push(`/chat/${newSession.id}`);
          }}
        />
      )}
    </>
  );
}
