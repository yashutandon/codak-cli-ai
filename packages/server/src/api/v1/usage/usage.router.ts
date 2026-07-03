import { Router } from "express";
import { z } from "zod";
import { db } from "@codak/database";
import type { AuthRequest } from "../../middleware/auth.middleware";

const usageRouter = Router();

// Zod schema for usage tracking request
const trackUsageSchema = z.object({
  sessionId: z.string().optional(),
  promptTokens: z.number().default(0),
  completionTokens: z.number().default(0),
  totalTokens: z.number().default(0),
  model: z.string().optional(),
});

usageRouter.post("/track", async (req, res) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const data = trackUsageSchema.parse(req.body);

    // Calculate approximate cost (can be extracted to a config mapping)
    // E.g., for GPT-4o: $5.00 / 1M prompt, $15.00 / 1M completion
    let cost = 0;
    if (data.model?.includes("gpt-4o")) {
      cost = (data.promptTokens * 5.0 / 1000000) + (data.completionTokens * 15.0 / 1000000);
    } else if (data.model?.includes("claude-3-5")) {
      cost = (data.promptTokens * 3.0 / 1000000) + (data.completionTokens * 15.0 / 1000000);
    }

    const usage = await db.usageToken.create({
      data: {
        userId,
        sessionId: data.sessionId,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        cost,
      },
    });

    res.json({ success: true, data: usage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: "Invalid payload", details: error.issues } });
    }
    console.error("Usage track error:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

usageRouter.get("/stats", async (req, res) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    // Get current month's start date
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await db.usageToken.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
    });

    res.json({ 
      success: true, 
      data: {
        promptTokens: stats._sum.promptTokens || 0,
        completionTokens: stats._sum.completionTokens || 0,
        totalTokens: stats._sum.totalTokens || 0,
        cost: stats._sum.cost || 0.0,
      }
    });
  } catch (error) {
    console.error("Usage stats error:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

export default usageRouter;
