import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { registerHandler, loginHandler, refreshHandler, logoutHandler } from "./auth.controller";
import {
  githubInit,
  githubCallback,
  googleInit,
  googleCallback,
} from "././oauth/oauth.controller";

const authRouter = Router();

// ─── Rate Limiters ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many login attempts. Please try again in 15 minutes.", statusCode: 429 },
  },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many accounts created. Please try again later.", statusCode: 429 },
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ─── Email/Password Routes ─────────────────────────────────────
authRouter.post("/register", registerLimiter, registerHandler);
authRouter.post("/login",    loginLimiter,    loginHandler);
authRouter.post("/refresh",  refreshLimiter,  refreshHandler);
authRouter.post("/logout",   logoutHandler);

// ─── GitHub OAuth ──────────────────────────────────────────────
authRouter.get("/github",          oauthLimiter, githubInit);
authRouter.get("/github/callback", oauthLimiter, githubCallback);

// ─── Google OAuth ──────────────────────────────────────────────
authRouter.get("/google",          oauthLimiter, googleInit);
authRouter.get("/google/callback", oauthLimiter, googleCallback);

export default authRouter;