import { z } from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  mode: z.enum(["BUILD", "PLAN"]).default("BUILD"),
  model: z.string(),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;