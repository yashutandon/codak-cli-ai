/**
 * BullMQ Worker Entry Point
 *
 * Run this separately from the main Express server:
 *   Development:  bun run worker
 *   Production:   node dist/worker.js
 *
 * This process handles all CPU/IO-heavy embedding jobs
 * so the main HTTP server stays responsive.
 */
import "dotenv/config";
import { createEmbeddingWorker } from "./api/infra/queue/embedding.worker";
import { redis, bullmqRedis } from "./api/infra/redis/redis";

console.log("🔧 Starting BullMQ Embedding Worker...");

const worker = createEmbeddingWorker();

console.log("✅ Embedding worker running. Waiting for jobs...");

/**
 * Graceful shutdown — finish current job before exiting.
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal} — shutting down worker gracefully...`);

  await worker.close(); // wait for current job to finish
  await redis.quit();
  await bullmqRedis.quit();

  console.log("👋 Worker shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception in worker:", err);
  shutdown("uncaughtException").catch(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection in worker:", reason);
  shutdown("unhandledRejection").catch(() => process.exit(1));
});
