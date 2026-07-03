import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

/**
 * Shared Redis client.
 * Use for caching, rate limiting, pub/sub, and storing indexing status.
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

/**
 * Separate Redis connection for BullMQ.
 * BullMQ REQUIRES maxRetriesPerRequest: null — otherwise workers crash silently.
 */
export const bullmqRedis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ mandatory setting
  enableReadyCheck: false,
  tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

bullmqRedis.on("error", (err) => {
  console.error("❌ BullMQ Redis error:", err.message);
});

bullmqRedis.on("connect", () => {
  console.log("✅ BullMQ Redis connected");
});