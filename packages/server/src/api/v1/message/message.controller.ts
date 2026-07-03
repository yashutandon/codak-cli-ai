import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { sendMessage } from "./message.service";
import { SendMessageSchema } from "./message.dto";
import { AppError } from "../../../utils/AppError";
import { resolveApproval } from "../../lib/tools/approval.service";
import { setActiveStreamController } from "../../lib/tools/executor";
import { z } from "zod";
import { db } from "@codak/database";

const ApprovalSchema = z.object({
  toolCallId: z.string().min(1),
  approved: z.boolean(),
});

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

    const response = await sendMessage(req.params.id, userId, parsed.data);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const write = (event: object) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // PLAN mode
    if (response.isPlanner) {
      const reader = response.planStream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
      res.end();
      return;
    }

    // BUILD mode — wire SSE controller so executor can push approval events
    const stream = new ReadableStream({
      start(controller) {
        setActiveStreamController(controller);
      },
    });

    // Pipe tool-approval-required events from executor to res
    (async () => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
    })().catch(() => {});

    for await (const chunk of response.result.fullStream) {
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
        const c = chunk as any;
        const usage = c.usage || { promptTokens: 0, completionTokens: 0 };
        const promptTokens = usage.promptTokens || 0;
        const completionTokens = usage.completionTokens || 0;
        const totalTokens = promptTokens + completionTokens;
        
        // Calculate approximate cost (can be moved to a config module later)
        let cost = 0;
        const modelName = parsed.data.model || "claude-3-5-sonnet";
        if (modelName.includes("gpt-4o")) {
          cost = (promptTokens * 5.0 / 1000000) + (completionTokens * 15.0 / 1000000);
        } else if (modelName.includes("claude-3-5")) {
          cost = (promptTokens * 3.0 / 1000000) + (completionTokens * 15.0 / 1000000);
        }

        // Save to DB asynchronously so it doesn't block stream finish
        db.usageToken.create({
          data: {
            userId,
            sessionId: req.params.id,
            promptTokens,
            completionTokens,
            totalTokens,
            cost,
          }
        }).catch((err: any) => console.error("Failed to track usage:", err));

        write({ type: "done", usage });
      }
    }

    setActiveStreamController(null);
    res.end();
  } catch (err) {
    setActiveStreamController(null);
    next(err);
  }
}

export async function approvalHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ApprovalSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError("toolCallId and approved are required", 400));
    }

    await resolveApproval(parsed.data.toolCallId, parsed.data.approved);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}