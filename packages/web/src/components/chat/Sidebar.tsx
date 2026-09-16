"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import type { SessionDto, UserProfile } from "@/types/api";
import { getSessions, deleteSession, getUserProfile } from "@/lib/api";
import { logout } from "@/lib/auth";
import {
  PlusIcon,
  TrashIcon,
  LogOutIcon,
  TerminalIcon,
  ChevronRightIcon,
  MessageSquare,
  BarChart2,
  CreditCard,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  sessions?: SessionDto[];
  onNewChat?: () => void;
  onSessionDeleted?: (id: string) => void;
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

export default function Sidebar({
  sessions: initialSessions,
  onNewChat,
  onSessionDeleted,
}: SidebarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const activeId = params?.sessionId as string | undefined;

  const [sessions, setSessions] = useState<SessionDto[]>(initialSessions ?? []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync if initialSessions prop changes
  useEffect(() => {
    if (initialSessions) {
      setSessions(initialSessions);
    } else {
      getSessions().then(setSessions).catch(() => {});
    }
  }, [initialSessions]);

  // Load user profile for tier indicator
  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {});
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onSessionDeleted?.(id);
      if (activeId === id) router.push("/chat");
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push("/chat");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/chat",
      active: pathname.startsWith("/chat"),
    },
    {
      label: "Usage",
      icon: BarChart2,
      href: "/usage",
      active: pathname.startsWith("/usage"),
    },
    {
      label: "Billing",
      icon: CreditCard,
      href: "/billing",
      active: pathname.startsWith("/billing"),
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      href: "/settings",
      active: pathname.startsWith("/settings"),
    },
  ];

  const tierColors: Record<string, string> = {
    FREE: "text-zinc-400 bg-zinc-800/80 border-zinc-700",
    PRO: "text-indigo-300 bg-indigo-950/80 border-indigo-500/40",
    ENTERPRISE: "text-amber-300 bg-amber-950/80 border-amber-500/40",
  };

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-white/[0.06] bg-[#07070d]/90 backdrop-blur-md select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div
          onClick={() => router.push("/chat")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600/90 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <TerminalIcon size={14} className="text-white" />
          </div>
          <span
            className="text-sm font-bold text-white tracking-widest"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            CODAK
          </span>
        </div>
        {profile?.tier && (
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
              tierColors[profile.tier] || tierColors.FREE
            }`}
          >
            {profile.tier}
          </span>
        )}
      </div>

      {/* Primary Navigation */}
      <div className="px-3 py-2 space-y-1 border-b border-white/[0.06]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                item.active
                  ? "bg-indigo-600/15 text-white font-medium border border-indigo-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon
                size={16}
                className={item.active ? "text-indigo-400" : "text-white/40"}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* New Chat Action */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 transition-all duration-150 border border-indigo-500/20 hover:border-indigo-500/40 shadow-sm"
        >
          <PlusIcon size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Session History Title */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] font-medium text-white/30 uppercase tracking-wider">
        <span>Recent Sessions</span>
        <span className="text-[10px]">{sessions.length}</span>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 custom-scrollbar">
        {sessions.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-8 px-2">
            No active sessions. Start a new chat above.
          </p>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeId;
            const lastMsg = s.messages?.[0];
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
                        isActive
                          ? "text-indigo-300"
                          : "text-white/75 group-hover:text-white"
                      }`}
                    >
                      {s.title || "Untitled Session"}
                    </p>
                    {lastMsg?.content && (
                      <p className="text-xs text-white/30 truncate mt-0.5">
                        {lastMsg.content.slice(0, 48)}
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
                  <ChevronRightIcon
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400"
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Upgrade Banner if Free */}
      {profile?.tier === "FREE" && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-900/40 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 mb-1">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed mb-2">
            Unlock multi-agent workflow, RAG indexing & 5x rate limits.
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      {/* Footer / User Profile & Logout */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {profile?.name
              ? profile.name.slice(0, 2).toUpperCase()
              : profile?.email
              ? profile.email.slice(0, 2).toUpperCase()
              : "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">
              {profile?.name || profile?.email?.split("@")[0] || "Account"}
            </p>
            <p className="text-[10px] text-white/30 truncate">
              {profile?.email || "Signed in"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          title="Sign out"
        >
          <LogOutIcon size={14} />
        </button>
      </div>
    </aside>
  );
}
