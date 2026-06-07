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

    for await (const chunk of result.textStream) {
      res.write(
        `data: ${JSON.stringify({ type: "text-delta", text: chunk })}\n\n`
      );
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    next(err);
  }
}