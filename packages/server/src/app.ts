import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import "dotenv/config";

import v1Router from "./api/v1";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

// Security Headers
app.use(helmet());

// Gzip Compression
app.use(compression());

// Global Rate Limiting (Basic protection against DDoS)
// Note: Specific routes like auth or heavy processing can have stricter local limits
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: "draft-7", 
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use(globalLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Webhook route must receive the raw body buffer for HMAC signature verification.
// This middleware MUST be registered before the global express.json() parser.
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", v1Router);
app.use(notFoundMiddleware);
app.use(errorMiddleware);