import { findSupportedChatModel } from "@codak/shared";
import { z } from "zod";

export const RoleSchema = z.enum(["USER", "ASSISTANT", "ERROR"]);
export const ModeSchema = z.enum(["BUILD", "PLAN"]);
export const MessageStatusSchema = z.enum(["COMPLETE", "INTERRUPTED"]);

export const CreateSessionSchema = z.object({
  title: z.string(),
  cwd: z.string().optional(),
  intialMessage: z.object({
    role: RoleSchema,
    content: z.string(),
    mode: ModeSchema,
    model: z.string().refine((id) => !!findSupportedChatModel(id), "Unsupported model"),
  }).optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

export type Role = z.infer<typeof RoleSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export interface Mesage {
  id: string;
  role: Role;
  title: string;
  content: string;
  status: MessageStatus;
  part: null;
  mode: Mode;
  model: string;
  duration: number | null;
  createdAt: Date;
  sessionId: string;
}

export interface SessionDto {
  id: string;
  title: string;
  cwd: string | null;
  userId: string;
  createdAt: Date;
  messages: Mesage[];
}

export interface GetSessionParamsDto {
  id: string;
}