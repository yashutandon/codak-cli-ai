import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { sendMessage } from "./message.service";
import { SendMessageSchema } from "./message.dto";
import { AppError } from "../../../utils/AppError";

export async function sendMessageHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as unknown as AuthRequest).userId;

    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const result = await sendMessage(req.params.id, userId, parsed.data);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const write = (event: object) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    for await (const chunk of result.fullStream) {
      if (chunk.type === "text-delta") {
        write({ type: "text-delta", text: chunk.text });

      } else if (chunk.type === "tool-call") {
        const c = chunk as any;
        write({
          type: "tool-call",
          toolCallId: c.toolCallId,
          toolName: c.toolName,
          args: c.input ?? c.args ?? {},
        });

      } else if (chunk.type === "tool-result") {
        const c = chunk as any;
        write({
          type: "tool-result",
          toolCallId: c.toolCallId,
          result: String(c.output ?? c.result ?? ""),
        });

      } else if (chunk.type === "reasoning-delta") {
        const c = chunk as any;
        const text = c.textDelta ?? c.text;
        if (text) write({ type: "reasoning-delta", text });

      } else if (chunk.type === "finish") {
        write({ type: "done" });
      }
    }

    res.end();
  } catch (err) {
    next(err);
  }
}