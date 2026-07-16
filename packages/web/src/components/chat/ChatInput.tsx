"use client";

import { useRef, useState, useEffect } from "react";
import { SUPPORTED_CHAT_MODELS, DEFAULT_CHAT_MODEL_ID } from "@codak/shared";
import { SendHorizonalIcon, ChevronDownIcon, ZapIcon, BrainIcon } from "lucide-react";
import IndexingBadge from "@/components/chat/IndexingBadge";

interface ChatInputProps {
  sessionId: string;
  disabled?: boolean;
  onSend: (content: string, model: string, mode: "BUILD" | "PLAN") => void;
}

export default function ChatInput({ sessionId, disabled, onSend }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL_ID);
  const [mode, setMode] = useState<"BUILD" | "PLAN">("BUILD");
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [content]);

  // Close model dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, model, mode);
    setContent("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModel = SUPPORTED_CHAT_MODELS.find((m) => m.id === model);

  return (
    <div className="px-4 py-3 border-t border-white/[0.06] bg-black/20">
      {/* Status bar */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <IndexingBadge sessionId={sessionId} />
        <div className="flex-1" />
      </div>

      {/* Input card */}
      <div
        className="rounded-xl border border-white/[0.08] focus-within:border-indigo-500/40 transition-all duration-200"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? "Waiting for response…"
              : mode === "PLAN"
              ? "Describe what you want to plan…"
              : "Ask Codak to read, write, or run something…"
          }
          rows={1}
          className="w-full px-4 pt-3 pb-1 text-sm text-white/85 placeholder-white/20 bg-transparent resize-none outline-none leading-relaxed disabled:opacity-40"
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-1">
          {/* Mode toggle */}
          <button
            onClick={() => setMode((m) => (m === "BUILD" ? "PLAN" : "BUILD"))}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-40 ${
              mode === "PLAN"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "bg-white/[0.05] text-white/50 border border-white/[0.06] hover:text-white/80"
            }`}
          >
            {mode === "PLAN" ? <BrainIcon size={11} /> : <ZapIcon size={11} />}
            {mode}
          </button>

          {/* Model picker */}
          <div className="relative" ref={modelRef}>
            <button
              onClick={() => setModelOpen(!modelOpen)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-white/40 hover:text-white/70 bg-white/[0.04] border border-white/[0.06] transition-all duration-150 disabled:opacity-40"
            >
              <span className="max-w-[120px] truncate">{selectedModel?.displayName ?? model}</span>
              <ChevronDownIcon size={10} className={`transition-transform ${modelOpen ? "rotate-180" : ""}`} />
            </button>

            {modelOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-white/[0.08] bg-[#0d0d1a] shadow-xl shadow-black/50 overflow-hidden z-50">
                <div className="p-1.5 max-h-64 overflow-y-auto">
                  {SUPPORTED_CHAT_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setModelOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-100 ${
                        m.id === model
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                      }`}
                    >
                      <span className="font-medium">{m.displayName}</span>
                      <span className="ml-2 text-white/25 text-[10px] capitalize">{m.provider}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !content.trim()}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150"
          >
            <SendHorizonalIcon size={14} className="text-white" />
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-white/15 mt-2">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
