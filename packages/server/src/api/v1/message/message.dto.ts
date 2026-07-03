import { z } from "zod";
import { findSupportedChatModel } from "@codak/shared";

export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(32_000, "Message too long (max 32,000 characters)"),
  mode: z.enum(["BUILD", "PLAN"]).default("BUILD"),
  model: z.string().refine(
    (id) => !!findSupportedChatModel(id),
    "Unsupported model. Use a valid model ID."
  ),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;