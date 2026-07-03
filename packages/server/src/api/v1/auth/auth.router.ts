import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { registerHandler, loginHandler } from "./auth.controller";
import {
  githubInit,
  githubCallback,
  googleInit,
  googleCallback,
} from "././oauth/oauth.controller";

const authRouter = Router();

// ─── Rate Limiters ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                 // 10 attempts per window per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many login attempts. Please try again in 15 minutes.", statusCode: 429 },
  },
  skipSuccessfulRequests: true, // only count failures
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,                  // 5 registrations per hour per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many accounts created. Please try again later.", statusCode: 429 },
  },
});

const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ─── Email/Password Routes ─────────────────────────────────────
authRouter.post("/register", registerLimiter, registerHandler);
authRouter.post("/login",    loginLimiter,    loginHandler);

// ─── GitHub OAuth ──────────────────────────────────────────────
authRouter.get("/github",          oauthLimiter, githubInit);
authRouter.get("/github/callback", oauthLimiter, githubCallback);

// ─── Google OAuth ──────────────────────────────────────────────
authRouter.get("/google",          oauthLimiter, googleInit);
authRouter.get("/google/callback", oauthLimiter, googleCallback);

export default authRouter;