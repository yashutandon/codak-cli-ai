import { type Request, type Response } from "express";
import { healthService } from "./health.service";

class HealthController {
  getHealth = async (_req: Request, res: Response) => {
    const result = healthService.getHealth();

    return res.status(200).json(result);
  };
}

export const healthController = new HealthController();