"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types/api";
import { BotIcon, UserIcon, TerminalIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface StreamingMessage {
  role: "ASSISTANT";
  content: string;
  isStreaming: true;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
}

interface MessageThreadProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  toolCalls: ToolCall[];
}

function ToolCallBlock({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-lg border border-white/[0.06] bg-black/40 overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
      >
        <TerminalIcon size={11} className="text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">{call.toolName}</span>
        {call.result && (
          <span className="ml-auto text-emerald-500/60 text-[10px]">✓ done</span>
        )}
        <ChevronDownIcon
          size={11}
          className={`text-white/30 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-white/[0.06]">
          <div className="px-3 py-2 text-white/50 text-[10px] uppercase tracking-wider">Input</div>
          <pre className="px-3 pb-2 text-[11px] text-white/60 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(call.args, null, 2)}
          </pre>
          {call.result && (
            <>
              <div className="px-3 py-2 text-white/50 text-[10px] uppercase tracking-wider border-t border-white/[0.06]">
                Output
              </div>
              <pre className="px-3 pb-2 text-[11px] text-emerald-400/70 overflow-x-auto whitespace-pre-wrap break-all">
                {call.result.slice(0, 1000)}
                {call.result.length > 1000 ? "\n…(truncated)" : ""}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  streamingCalls,
}: {
  message: Message | StreamingMessage;
  streamingCalls?: ToolCall[];
}) {
  const isUser = message.role === "USER";
  const isStreaming = "isStreaming" in message;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-indigo-600/60" : "bg-zinc-800"
        }`}
      >
        {isUser ? (
          <UserIcon size={13} className="text-white" />
        ) : (
          <BotIcon size={13} className="text-indigo-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-600/20 border border-indigo-500/20 text-white/90 rounded-tr-sm"
              : "bg-white/[0.04] border border-white/[0.06] text-white/80 rounded-tl-sm"
          }`}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 rounded-sm animate-pulse align-middle" />
          )}
        </div>

        {/* Tool calls */}
        {streamingCalls && streamingCalls.length > 0 && (
          <div className="w-full mt-1 space-y-1">
            {streamingCalls.map((tc) => (
              <ToolCallBlock key={tc.toolCallId} call={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessageThread({
  messages,
  streamingContent,
  isStreaming,
  toolCalls,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, toolCalls]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <BotIcon size={24} className="text-indigo-400/60" />
        </div>
        <h2 className="text-lg font-semibold text-white/50 mb-2">Ready to code</h2>
        <p className="text-sm text-white/25 max-w-sm">
          Ask me to read files, write code, run commands, or plan a feature.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Streaming assistant message */}
      {isStreaming && (
        <MessageBubble
          message={{ role: "ASSISTANT", content: streamingContent, isStreaming: true }}
          streamingCalls={toolCalls}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
