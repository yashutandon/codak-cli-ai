export type Role = "USER" | "ASSISTANT" | "ERROR";
export type Mode = "BUILD" | "PLAN";
export type MessageStatus = "COMPLETE" | "INTERRUPTED";

export interface Message {
  id: string;
  role: Role;
  title: string;
  content: string;
  status: MessageStatus;
  part: null;
  mode: Mode;
  model: string;
  duration: number | null;
  createdAt: string;
  sessionId: string;
}