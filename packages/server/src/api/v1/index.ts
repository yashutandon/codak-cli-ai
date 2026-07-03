import { Router } from "express";
import sessionRouter from "./session/session.routes";
import authRouter from "./auth/auth.router";
import { authenticate } from "../middleware/auth.middleware";
import messageRouter from "./message/message.router";
import healthRouter from "./health/health.routes";
import paymentRouter from "./payment/payment.router";
import usageRouter from "./usage/usage.router";

const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/sessions", authenticate, sessionRouter);
v1Router.use("/sessions/:id/messages", authenticate, messageRouter);
v1Router.use("/payments", paymentRouter);
v1Router.use("/usage", authenticate, usageRouter);


export default v1Router;