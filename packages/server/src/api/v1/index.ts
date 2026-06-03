import { Router } from "express";
import { healthRouter } from "./health/health.routes";

const v1Router = Router();

v1Router.use("/health", healthRouter);

export default v1Router;