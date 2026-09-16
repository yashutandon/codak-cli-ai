"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";
import { getUsageStats, getUsageHistory } from "@/lib/api";
import type { UsageStats, UsageHistoryResponse, DailyUsage } from "@/types/api";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Cpu,
  Layers,
  Calendar,
  RotateCw,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function UsagePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [history, setHistory] = useState<UsageHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DailyUsage | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, historyData] = await Promise.all([
        getUsageStats(),
        getUsageHistory(),
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (err) {
      console.error("Failed to load usage data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations for the SVG chart
  const chartMetrics = useMemo(() => {
    const daily = history?.daily ?? [];
    if (daily.length === 0) return { maxTokens: 1, daily: [] };

    const max = Math.max(...daily.map((d) => d.totalTokens), 100);
    return { maxTokens: max, daily };
  }, [history]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  return (
    <>
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#080810] text-white select-none">
        {/* Top bar header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-[#080810]/80 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
              <BarChart3 size={14} />
              <span>Workspace Analytics</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Usage & Token Consumption
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            >
              <RotateCw
                size={13}
                className={loading ? "animate-spin text-indigo-400" : ""}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => router.push("/billing")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
            >
              <Sparkles size={13} />
              <span>Manage Plan</span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tokens */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between text-white/40 mb-3">
                <span className="text-xs font-medium">Total Tokens</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Cpu size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {stats ? formatNumber(stats.totalTokens) : "—"}
              </div>
              <p className="text-[11px] text-white/30 mt-1">
                Lifetime token consumption
              </p>
            </div>

            {/* Prompt Tokens */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between text-white/40 mb-3">
                <span className="text-xs font-medium">Prompt Tokens</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {stats ? formatNumber(stats.promptTokens) : "—"}
              </div>
              <p className="text-[11px] text-white/30 mt-1">
                Context & instructions sent
              </p>
            </div>

            {/* Completion Tokens */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between text-white/40 mb-3">
                <span className="text-xs font-medium">Completion Tokens</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Layers size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {stats ? formatNumber(stats.completionTokens) : "—"}
              </div>
              <p className="text-[11px] text-white/30 mt-1">
                Generated code & responses
              </p>
            </div>

            {/* Total Cost */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between text-white/40 mb-3">
                <span className="text-xs font-medium">Estimated Cost</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-white">
                ${stats ? stats.cost.toFixed(4) : "0.0000"}
              </div>
              <p className="text-[11px] text-white/30 mt-1">
                Approximate model compute
              </p>
            </div>
          </div>

          {/* 30-Day Activity Chart */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  30-Day Activity Trend
                </h2>
                <p className="text-xs text-white/40">
                  Daily token consumption across all models
                </p>
              </div>

              {/* Hover indicator */}
              {hoveredDay ? (
                <div className="text-right text-xs bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                  <span className="text-white/60 mr-2">{hoveredDay.date}:</span>
                  <span className="font-semibold text-indigo-300">
                    {hoveredDay.totalTokens.toLocaleString()} tokens
                  </span>
                  <span className="text-white/40 ml-2">
                    (${hoveredDay.cost.toFixed(4)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                    <span>Total Tokens</span>
                  </div>
                </div>
              )}
            </div>

            {/* SVG Bar Chart */}
            <div className="pt-4">
              <div className="h-48 w-full flex items-end gap-1 sm:gap-2 px-2 pb-2 border-b border-white/[0.08]">
                {chartMetrics.daily.map((day, idx) => {
                  const heightPercent = Math.max(
                    (day.totalTokens / chartMetrics.maxTokens) * 100,
                    4
                  );
                  const isHovered = hoveredDay?.date === day.date;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all duration-200 ${
                          day.totalTokens > 0
                            ? isHovered
                              ? "bg-indigo-400 shadow-lg shadow-indigo-500/50"
                              : "bg-indigo-600/80 hover:bg-indigo-500"
                            : "bg-white/[0.05]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis dates (every 5 days) */}
              <div className="flex justify-between text-[10px] text-white/30 pt-2 px-2">
                {chartMetrics.daily
                  .filter((_, idx) => idx % 6 === 0)
                  .map((day) => (
                    <span key={day.date}>{day.date.slice(5)}</span>
                  ))}
              </div>
            </div>
          </div>

          {/* Breakdown Section: Sessions & Recent Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Sessions */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">
                  Usage by Session
                </h2>
                <span className="text-xs text-white/40">
                  {history?.sessions.length ?? 0} active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1 custom-scrollbar">
                {!history?.sessions || history.sessions.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-12">
                    No sessions logged yet.
                  </p>
                ) : (
                  history.sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      onClick={() =>
                        sess.sessionId !== "adhoc" &&
                        router.push(`/chat/${sess.sessionId}`)
                      }
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">
                            {sess.title}
                          </p>
                          {sess.sessionId !== "adhoc" && (
                            <ArrowUpRight
                              size={12}
                              className="text-white/30 group-hover:text-indigo-400 shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          Last used {sess.lastUsed.slice(0, 10)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-indigo-300">
                          {formatNumber(sess.totalTokens)} tok
                        </p>
                        <p className="text-[10px] text-white/40">
                          ${sess.cost.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Transaction Log */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">
                  Recent Token Invocations
                </h2>
                <span className="text-xs text-white/40">Latest 20</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1 custom-scrollbar">
                {!history?.recent || history.recent.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-12">
                    No recent token activity.
                  </p>
                ) : (
                  history.recent.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-medium text-white/80 truncate">
                          {rec.sessionTitle}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
                          <Calendar size={10} />
                          <span>
                            {new Date(rec.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>In: {rec.promptTokens}</span>
                          <span>Out: {rec.completionTokens}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-white/70">
                          +{rec.totalTokens.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          ${rec.cost.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
