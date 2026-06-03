import type{ HealthResponseDto } from "./health.dto";

export class HealthService {
  getHealth(): HealthResponseDto {
    return {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

export const healthService = new HealthService();