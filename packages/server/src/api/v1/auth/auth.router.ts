import { Router } from "express";
import { registerHandler, loginHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);

export default authRouter;