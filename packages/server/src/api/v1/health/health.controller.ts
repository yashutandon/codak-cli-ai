import { type Request, type Response } from "express";
import { getHealth } from "./health.service";

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const result = await getHealth();
  const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(result);
}