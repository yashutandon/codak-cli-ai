"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { SessionDto } from "@/types/api";
import { deleteSession } from "@/lib/api";
import { logout } from "@/lib/auth";
import { PlusIcon, TrashIcon, LogOutIcon, TerminalIcon, ChevronRightIcon } from "lucide-react";

interface SidebarProps {
  sessions: SessionDto[];
  onNewChat: () => void;
  onSessionDeleted: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Sidebar({ sessions, onNewChat, onSessionDeleted }: SidebarProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.sessionId as string | undefined;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteSession(id);
      onSessionDeleted(id);
      if (activeId === id) router.push("/chat");
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-white/[0.06] bg-black/30">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center shrink-0">
          <TerminalIcon size={14} className="text-white" />
        </div>
        <span
          className="text-sm font-bold text-white uppercase tracking-widest"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          CODAK
        </span>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06] hover:border-white/[0.12]"
        >
          <PlusIcon size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {sessions.length === 0 && (
          <p className="text-xs text-white/20 text-center py-8 px-2">
            No sessions yet. Start a new chat.
          </p>
        )}
        {sessions.map((s) => {
          const isActive = s.id === activeId;
          const lastMsg = s.messages[0];
          return (
            <button
              key={s.id}
              onClick={() => router.push(`/chat/${s.id}`)}
              className={`group relative w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600/20 border border-indigo-500/30"
                  : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate ${
                      isActive ? "text-indigo-300" : "text-white/70 group-hover:text-white/90"
                    }`}
                  >
                    {s.title}
                  </p>
                  {lastMsg && (
                    <p className="text-xs text-white/30 truncate mt-0.5">
                      {lastMsg.content.slice(0, 50)}
                    </p>
                  )}
                  <p className="text-[10px] text-white/20 mt-1">
                    {timeAgo(s.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deletingId === s.id}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  title="Delete session"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
              {isActive && (
                <ChevronRightIcon size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer — Logout */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-150"
        >
          <LogOutIcon size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
