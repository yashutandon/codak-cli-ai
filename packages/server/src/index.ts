import "dotenv/config";
import { app } from "./app";
import { redis, bullmqRedis } from "./api/infra/redis/redis";
import { embeddingQueue } from "./api/infra/queue/embedding.queue";
import { initContainerManager } from "./api/infra/docker/container-manager";

const PORT = process.env.PORT || 3001;

initContainerManager().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  /**
   * Graceful shutdown — close HTTP connections, Redis, queues.
   */
  async function shutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal} — shutting down server gracefully...`);

  server.close(async (err) => {
    if (err) {
      console.error("❌ Error closing HTTP server:", err);
    }

    try {
      await embeddingQueue.close();
      await redis.quit();
      await bullmqRedis.quit();
      console.log("👋 Server shut down cleanly.");
      process.exit(0);
    } catch (cleanupErr) {
      console.error("❌ Error during cleanup:", cleanupErr);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("⏰ Graceful shutdown timeout — forcing exit.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  shutdown("uncaughtException").catch(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});
});