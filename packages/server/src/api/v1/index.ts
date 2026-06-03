import { Router } from "express";
import { healthRouter } from "./health/health.routes";
import { sessionRouter } from "./session/session.routes";

const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/sessions", sessionRouter);

export default v1Router;