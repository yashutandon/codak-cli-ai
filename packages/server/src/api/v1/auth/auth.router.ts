import { Router } from "express";
import { registerHandler, loginHandler } from "./auth.controller";
import {
  githubInit,
  githubCallback,
  googleInit,
  googleCallback,
} from "././oauth/oauth.controller";

const authRouter = Router();

// Email/Password
authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);

// GitHub OAuth
authRouter.get("/github", githubInit);
authRouter.get("/github/callback", githubCallback);

// Google OAuth
authRouter.get("/google", googleInit);
authRouter.get("/google/callback", googleCallback);

export default authRouter;