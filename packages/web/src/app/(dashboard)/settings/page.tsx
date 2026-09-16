"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";
import { getUserProfile } from "@/lib/api";
import { logout } from "@/lib/auth";
import type { UserProfile } from "@/types/api";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Sliders,
  AlertTriangle,
  LogOut,
  Sparkles,
  Check,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Local preferences
  const [defaultModel, setDefaultModel] = useState("gemini-2.0-flash");
  const [defaultMode, setDefaultMode] = useState<"BUILD" | "PLAN">("BUILD");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load profile
    getUserProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load stored preferences
    const savedModel = localStorage.getItem("codak_default_model");
    if (savedModel) setDefaultModel(savedModel);

    const savedMode = localStorage.getItem("codak_default_mode") as "BUILD" | "PLAN";
    if (savedMode) setDefaultMode(savedMode);
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem("codak_default_model", defaultModel);
    localStorage.setItem("codak_default_mode", defaultMode);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") return;
    logout();
    router.push("/login");
  };

  return (
    <>
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#080810] text-white select-none">
        {/* Top bar header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-[#080810]/80 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
              <SettingsIcon size={14} />
              <span>User & Workspace</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Account Settings
            </h1>
          </div>
        </header>

        {/* Content body */}
        <div className="p-8 max-w-4xl w-full mx-auto space-y-8">
          {/* Profile Overview Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <User size={16} className="text-indigo-400" />
              <span>Profile Information</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/[0.06]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-md shadow-indigo-500/20 shrink-0">
                {profile?.name
                  ? profile.name.slice(0, 2).toUpperCase()
                  : profile?.email
                  ? profile.email.slice(0, 2).toUpperCase()
                  : "U"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {profile?.name || "Developer"}
                  </h2>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {profile?.tier || "FREE"}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{profile?.email}</p>
                <p className="text-[11px] text-white/20 mt-1">
                  User ID: {profile?.id || "—"}
                </p>
              </div>

              <button
                onClick={() => router.push("/billing")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-1.5 shrink-0"
              >
                <Sparkles size={13} className="text-indigo-400" />
                <span>Manage Plan</span>
              </button>
            </div>

            {/* Readonly details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-white/40 mb-1">Account Type</p>
                <p className="font-medium text-white/80">
                  {profile?.isOAuthUser ? "OAuth (Third-party SSO)" : "Email & Password"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-white/40 mb-1">Member Since</p>
                <p className="font-medium text-white/80">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sliders size={16} className="text-indigo-400" />
                <span>Workspace Preferences</span>
              </div>
              {saveSuccess && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check size={13} />
                  <span>Preferences saved</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Default Model */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Default Chat & Coding Model
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Fast & Capable)</option>
                  <option value="claude-3-5-sonnet-latest">Anthropic Claude 3.5 Sonnet (Pro recommended)</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B (Ultra Low Latency)</option>
                </select>
                <p className="text-[11px] text-white/30 mt-1">
                  Default model assigned when initializing new chats.
                </p>
              </div>

              {/* Default Mode */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">
                  Default Agent Execution Mode
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultMode("BUILD")}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                      defaultMode === "BUILD"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : "bg-white/[0.03] text-white/60 border-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                  >
                    BUILD (Tool Execution & Code Edits)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultMode("PLAN")}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                      defaultMode === "PLAN"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : "bg-white/[0.03] text-white/60 border-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                  >
                    PLAN (Architectural Analysis Only)
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08] transition-all"
                >
                  Save Workspace Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Security & Danger Zone */}
          <div className="p-6 rounded-2xl bg-red-950/10 border border-red-500/20 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertTriangle size={16} />
              <span>Danger Zone</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-red-500/10">
              <div>
                <p className="text-xs font-medium text-white/80">Sign Out</p>
                <p className="text-[11px] text-white/40">
                  End your current session and clear local access tokens.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all shrink-0 flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-xs font-medium text-red-400">Delete Account</p>
                <p className="text-[11px] text-white/40">
                  Permanently delete your profile, chat history, and indexing embeddings.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Modal Confirmation */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900 border border-red-500/30 space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <AlertTriangle size={18} />
                <span>Delete Account Confirmation</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                This action is irreversible. All your sessions, messages, and vector embeddings will be permanently wiped.
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/40">
                  Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE"}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
