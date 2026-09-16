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

usageRouter.get("/history", async (req, res) => {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const records = await db.usageToken.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        session: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build last 30 daily buckets
    const dailyMap = new Map<string, { date: string; promptTokens: number; completionTokens: number; totalTokens: number; cost: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });
    }

    // Build per-session summaries
    const sessionMap = new Map<string, { sessionId: string; title: string; totalTokens: number; cost: number; lastUsed: string }>();

    for (const r of records) {
      const dayKey = r.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dayKey);
      if (day) {
        day.promptTokens += r.promptTokens;
        day.completionTokens += r.completionTokens;
        day.totalTokens += r.totalTokens;
        day.cost += r.cost ?? 0;
      }

      const sid = r.sessionId ?? "adhoc";
      const title = r.session?.title ?? "Direct Request";
      const prev = sessionMap.get(sid) ?? { sessionId: sid, title, totalTokens: 0, cost: 0, lastUsed: r.createdAt.toISOString() };
      prev.totalTokens += r.totalTokens;
      prev.cost += r.cost ?? 0;
      prev.lastUsed = r.createdAt.toISOString();
      sessionMap.set(sid, prev);
    }

    res.json({
      success: true,
      data: {
        daily: Array.from(dailyMap.values()),
        sessions: Array.from(sessionMap.values()),
        recent: records.slice(-30).reverse().map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          sessionTitle: r.session?.title ?? "Direct Request",
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          cost: r.cost ?? 0,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Usage history error:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

export default usageRouter;
