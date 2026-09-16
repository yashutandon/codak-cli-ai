"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/chat/Sidebar";
import { getUserProfile, createSubscription } from "@/lib/api";
import type { UserProfile } from "@/types/api";
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function BillingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await createSubscription();
      if (res.mock) {
        setSuccessMessage(
          "Mock upgrade successful! In production, this opens Razorpay Checkout."
        );
        // Refresh profile to show updated tier
        getUserProfile().then(setProfile).catch(() => {});
      } else {
        setSuccessMessage(
          `Subscription created (ID: ${res.id}). Completing checkout...`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize upgrade");
    } finally {
      setLoading(false);
    }
  };

  const currentTier = profile?.tier || "FREE";

  const plans = [
    {
      id: "FREE",
      name: "Developer",
      price: "$0",
      period: "forever",
      description: "Core AI coding assistant for hobbyists and individual contributors.",
      features: [
        "20 messages / 15-minute window",
        "Fast models (Gemini 2.0 Flash, Groq Llama 3)",
        "Single-turn agent execution",
        "Community support & docs",
        "Local filesystem tools",
      ],
      cta: "Current Plan",
      disabled: currentTier === "FREE",
      popular: false,
    },
    {
      id: "PRO",
      name: "Pro Engineer",
      price: "$20",
      period: "per month",
      description: "Autonomous multi-agent pipelines for professional developers.",
      features: [
        "100 messages / 15-minute window (5x increase)",
        "State-of-the-art models (Claude 3.5 Sonnet, GPT-4o)",
        "Multi-Agent Planner + Coder + Reviewer loop",
        "RAG Codebase Indexing & Semantic Search",
        "Priority queue & low latency",
        "Private repository analysis",
      ],
      cta: currentTier === "PRO" ? "Current Plan" : "Upgrade to Pro",
      disabled: currentTier === "PRO",
      popular: true,
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise",
      price: "$99",
      period: "per seat / month",
      description: "Dedicated infrastructure, custom agents, and team governance.",
      features: [
        "500 messages / 15-minute window",
        "Custom model fine-tunes & local Ollama bridge",
        "SOC2 compliant data residency",
        "Team audit logs & shared workspaces",
        "Dedicated account manager & 99.9% SLA",
        "Custom security sandbox & firewall policies",
      ],
      cta: currentTier === "ENTERPRISE" ? "Current Plan" : "Contact Sales",
      disabled: currentTier === "ENTERPRISE",
      popular: false,
    },
  ];

  return (
    <>
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#080810] text-white select-none">
        {/* Top bar header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-[#080810]/80 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
              <CreditCard size={14} />
              <span>Plans & Subscriptions</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Billing Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Current Tier:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
              {currentTier}
            </span>
          </div>
        </header>

        {/* Content body */}
        <div className="p-8 max-w-6xl w-full mx-auto space-y-10">
          {/* Notifications */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
              <Check size={16} />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <Lock size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Status Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-purple-950/40 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">
                  Active Subscription
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {currentTier === "PRO"
                  ? "Pro Engineer Plan"
                  : currentTier === "ENTERPRISE"
                  ? "Enterprise Organization"
                  : "Free Developer Plan"}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                {currentTier === "FREE"
                  ? "Standard rate limits apply (20 req / 15m). Upgrade anytime to unlock autonomous agent pipelines."
                  : "All premium features active. Billed monthly via Razorpay."}
              </p>
            </div>

            {currentTier === "FREE" && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all shrink-0 flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span>{loading ? "Processing..." : "Upgrade to Pro ($20/mo)"}</span>
              </button>
            )}
          </div>

          {/* Pricing Grid */}
          <div>
            <div className="text-center max-w-lg mx-auto mb-8">
              <h3 className="text-lg font-bold text-white">
                Choose the right plan for your workflow
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Every plan includes our secure tool execution firewall and multi-language parser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = currentTier === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-2xl flex flex-col justify-between transition-all ${
                      plan.popular
                        ? "bg-gradient-to-b from-indigo-950/50 to-zinc-900/60 border-2 border-indigo-500/50 shadow-xl shadow-indigo-950/50"
                        : "bg-zinc-900/40 border border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-md">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold text-white">{plan.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/10 text-white/80">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/40 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="my-6">
                        <span className="text-3xl font-extrabold text-white">
                          {plan.price}
                        </span>
                        <span className="text-xs text-white/40 ml-1.5">
                          / {plan.period}
                        </span>
                      </div>

                      <div className="space-y-2.5 border-t border-white/[0.06] pt-6 mb-8">
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2.5 text-xs text-white/70">
                            <Check size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={plan.id === "PRO" ? handleUpgrade : undefined}
                      disabled={isCurrent || loading}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-white/[0.05] text-white/40 cursor-default border border-white/[0.05]"
                          : plan.popular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08]"
                      }`}
                    >
                      {isCurrent ? "Current Plan" : plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Guarantee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <ShieldCheck size={20} className="text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Secure Payments</p>
                <p className="text-[11px] text-white/40">PCI-DSS Level 1 powered by Razorpay</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Zap size={20} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Instant Activation</p>
                <p className="text-[11px] text-white/40">Upgraded tier takes effect immediately</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <HelpCircle size={20} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Cancel Anytime</p>
                <p className="text-[11px] text-white/40">No contracts, cancel with one click</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
