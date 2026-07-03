import { Router } from "express";
import { healthHandler } from "./health.controller";

const healthRouter = Router();

healthRouter.get("/", healthHandler);

export default healthRouter;