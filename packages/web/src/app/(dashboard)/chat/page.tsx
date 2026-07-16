"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSessions } from "@/lib/api";
import type { SessionDto } from "@/types/api";
import Sidebar from "@/components/chat/Sidebar";
import NewSessionModal from "@/components/chat/NewSessionModal";
import { BotIcon } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // auth error — layout will redirect
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <>
      <Sidebar
        sessions={sessions}
        onNewChat={() => setShowModal(true)}
        onSessionDeleted={(id) => setSessions((s) => s.filter((x) => x.id !== id))}
      />

      {/* Empty state */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5">
          <BotIcon size={28} className="text-indigo-400/50" />
        </div>
        <h1 className="text-xl font-semibold text-white/40 mb-2">No session selected</h1>
        <p className="text-sm text-white/20 mb-6 max-w-sm">
          Select a session from the sidebar or create a new one to start coding with Codak.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "rgba(99,102,241,0.8)" }}
        >
          New Chat Session
        </button>
      </main>

      {showModal && (
        <NewSessionModal
          onClose={() => setShowModal(false)}
          onCreated={(session) => {
            setSessions((s) => [session, ...s]);
            setShowModal(false);
            router.push(`/chat/${session.id}`);
          }}
        />
      )}
    </>
  );
}
