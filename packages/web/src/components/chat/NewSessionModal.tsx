"use client";

import { useState, useRef, useEffect } from "react";
import { createSession } from "@/lib/api";
import type { SessionDto } from "@/types/api";
import { XIcon, FolderOpenIcon, SparklesIcon } from "lucide-react";
import { Spinner } from "@/components/common/loader";

interface NewSessionModalProps {
  onClose: () => void;
  onCreated: (session: SessionDto) => void;
}

export default function NewSessionModal({ onClose, onCreated }: NewSessionModalProps) {
  const [title, setTitle] = useState("");
  const [cwd, setCwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await createSession({
        title: title.trim(),
        ...(cwd.trim() ? { cwd: cwd.trim() } : {}),
      });
      onCreated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.08] p-6"
        style={{ background: "#0d0d1a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SparklesIcon size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">New Chat Session</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">
              Session Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Fix auth middleware"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FolderOpenIcon size={11} />
              Working Directory
              <span className="text-white/20 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. C:/Users/you/my-project"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none font-mono transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              disabled={loading}
            />
            <p className="text-[10px] text-white/20 mt-1.5">
              If provided, Codak will index this directory for RAG context.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/[0.06] hover:bg-white/[0.04] transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "rgba(99,102,241,0.85)" }}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Creating…
              </>
            ) : (
              "Create Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
