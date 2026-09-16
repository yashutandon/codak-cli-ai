/**
 * api.ts — Shared TypeScript types for the web dashboard.
 * Mirrors the server's session.dto.ts shapes.
 */

export type Role = "USER" | "ASSISTANT" | "ERROR";
export type Mode = "BUILD" | "PLAN";
export type MessageStatus = "COMPLETE" | "INTERRUPTED";
export type IndexingStatus = "pending" | "indexing" | "done" | "failed";

export interface Message {
  id: string;
  role: Role;
  title: string;
  content: string;
  status: MessageStatus;
  part: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  } | null;
  mode: Mode;
  model: string;
  duration: number | null;
  createdAt: string;
  sessionId: string;
}

export interface SessionDto {
  id: string;
  title: string;
  cwd: string | null;
  userId: string;
  createdAt: string;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  tier: "FREE" | "PRO" | "ENTERPRISE";
  isOAuthUser: boolean;
  createdAt: string;
}

export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface DailyUsage {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface SessionUsage {
  sessionId: string;
  title: string;
  totalTokens: number;
  cost: number;
  lastUsed: string;
}

export interface RecentUsageItem {
  id: string;
  sessionId: string | null;
  sessionTitle: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: string;
}

export interface UsageHistoryResponse {
  daily: DailyUsage[];
  sessions: SessionUsage[];
  recent: RecentUsageItem[];
}

export interface SubscriptionResponse {
  id: string;
  entity: string;
  status: string;
  plan_id: string;
  customer_id?: string;
  mock?: boolean;
}

