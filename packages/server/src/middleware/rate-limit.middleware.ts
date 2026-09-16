import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";
import { db } from "@codak/database";
import type { AuthRequest } from "../api/middleware/auth.middleware";

/**
 * Tier-based rate limiter for the message endpoint.
 * Looks up the user's subscription tier from the database and applies
 * different limits per tier:
 *   FREE:       20 messages per 15 min
 *   PRO:        100 messages per 15 min
 *   ENTERPRISE: 500 messages per 15 min
 *
 * Uses the userId from the JWT as the rate limit key (not IP).
 */

const TIER_LIMITS: Record<string, number> = {
  FREE: 20,
  PRO: 100,
  ENTERPRISE: 500,
};

// In-memory cache to avoid hitting the DB on every single request.
// TTL: 5 minutes. After a tier change (e.g., payment upgrade), the user
// may need to wait up to 5 minutes for the new limit to take effect.
const tierCache = new Map<string, { tier: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getUserTier(userId: string): Promise<string> {
  const cached = tierCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tier;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });

    const tier = user?.tier ?? "FREE";
    tierCache.set(userId, { tier, expiresAt: Date.now() + CACHE_TTL_MS });
    return tier;
  } catch {
    // If DB fails, default to FREE tier limits (fail-closed)
    return "FREE";
  }
}

export const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: async (req: Request, _res: Response): Promise<number> => {
    const userId = (req as unknown as AuthRequest).userId;
    if (!userId) return 20;

    const tier = await getUserTier(userId);
    return TIER_LIMITS[tier] ?? 20;
  },
  keyGenerator: (req: Request) => {
    // Rate limit per user, not per IP
    return (req as unknown as AuthRequest).userId ?? "anonymous";
  },
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Message rate limit exceeded. Upgrade your plan for higher limits.",
      statusCode: 429,
    },
  },
});
