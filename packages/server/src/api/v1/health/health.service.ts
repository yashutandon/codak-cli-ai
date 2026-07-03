import { db } from "@codak/database";
import { redis } from "../../infra";

export interface HealthResponseDto {
  success: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    database: "ok" | "error";
    redis: "ok" | "error";
  };
}

export async function getHealth(): Promise<HealthResponseDto> {
  const [dbStatus, redisStatus] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const services = {
    database: dbStatus.status === "fulfilled" ? ("ok" as const) : ("error" as const),
    redis:    redisStatus.status === "fulfilled" ? ("ok" as const) : ("error" as const),
  };

  const allOk = services.database === "ok" && services.redis === "ok";
  const anyOk = services.database === "ok" || services.redis === "ok";

  return {
    success: allOk,
    status: allOk ? "healthy" : anyOk ? "degraded" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
  };
}