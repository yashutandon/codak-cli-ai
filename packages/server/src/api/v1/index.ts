import { Router } from "express";
import { healthRouter } from "./health/health.routes";
import sessionRouter from "./session/session.routes";
import authRouter from "./auth/auth.router";
import { authenticate } from "../middleware/auth.middleware";

const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/sessions", authenticate, sessionRouter);

export default v1Router;