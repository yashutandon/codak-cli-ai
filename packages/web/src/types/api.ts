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
