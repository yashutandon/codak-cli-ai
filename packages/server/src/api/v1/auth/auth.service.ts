import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { db } from "@codak/database";
import { AppError } from "../../../utils/AppError";
import type { RegisterDto, LoginDto, AuthResponseDto } from "./auth.dto";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const SALT_ROUNDS = 12;

// ─── Token helpers ────────────────────────────────────────────

function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = randomUUID();
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  );

  // Revoke any previous refresh tokens for this user (rolling strategy)
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await db.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });

  return rawToken;
}

// ─── Public auth functions ────────────────────────────────────

export async function register(data: RegisterDto): Promise<AuthResponseDto> {
  const existing = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name ?? null,
      password: hashedPassword,
      isOAuthUser: false,
    },
    select: { id: true, email: true, name: true },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user };
}

export async function login(data: LoginDto): Promise<AuthResponseDto> {
  const user = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, password: true, isOAuthUser: true },
  });

  // Same error for both user-not-found and wrong-password (prevent enumeration)
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Block OAuth users from using password login
  if (user.isOAuthUser || !user.password) {
    throw new AppError(
      "This account uses OAuth (GitHub/Google). Please sign in with that provider.",
      401
    );
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function refreshAccessToken(rawToken: string): Promise<AuthResponseDto> {
  // Find all active tokens for any user and check against hash
  // We use findMany with revokedAt null and check hash (avoids timing attacks from full table scan)
  // In practice the token is unique enough UUID so we just hash-check candidates
  const activeTokens = await db.refreshToken.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000, // safety cap
  });

  let matched: (typeof activeTokens)[0] | null = null;
  for (const record of activeTokens) {
    const ok = await bcrypt.compare(rawToken, record.tokenHash);
    if (ok) {
      matched = record;
      break;
    }
  }

  if (!matched) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Rotate — revoke old, issue new pair
  await db.refreshToken.update({
    where: { id: matched.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken(matched.userId);
  const refreshToken = await createRefreshToken(matched.userId);

  return {
    accessToken,
    refreshToken,
    user: { id: matched.user.id, email: matched.user.email, name: matched.user.name },
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const activeTokens = await db.refreshToken.findMany({
    where: { revokedAt: null },
    take: 1000,
  });

  for (const record of activeTokens) {
    const ok = await bcrypt.compare(rawToken, record.tokenHash);
    if (ok) {
      await db.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      return;
    }
  }
}

// Expose for OAuth service
export { signAccessToken, createRefreshToken };