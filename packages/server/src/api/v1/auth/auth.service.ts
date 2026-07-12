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
  const rawToken = randomUUID(); // e.g. "550e8400-e29b-41d4-a716-446655440000"
  // First UUID segment (8 hex chars) used as a selector for O(1) DB lookup.
  // It is NOT secret — it only identifies the candidate row. The hash verifies authenticity.
  const selector = rawToken.split("-")[0];
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
    data: { selector, tokenHash, userId, expiresAt },
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
  // O(1) lookup: extract selector from the token, fetch exactly one candidate row,
  // then bcrypt-verify only that row. Eliminates the previous O(N) full-table scan.
  const selector = rawToken.split("-")[0];

  const record = await db.refreshToken.findUnique({
    where: { selector },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  const isExpiredOrRevoked =
    !record || record.revokedAt !== null || record.expiresAt < new Date();

  // Always run bcrypt.compare to prevent timing-based enumeration attacks.
  // If no record found, compare against a dummy hash so timing stays constant.
  const DUMMY_HASH =
    "$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const ok = await bcrypt.compare(rawToken, record?.tokenHash ?? DUMMY_HASH);

  if (isExpiredOrRevoked || !ok) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Rotate — revoke old, issue new pair
  await db.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken(record.userId);
  const refreshToken = await createRefreshToken(record.userId);

  return {
    accessToken,
    refreshToken,
    user: { id: record.user.id, email: record.user.email, name: record.user.name },
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const selector = rawToken.split("-")[0];

  const record = await db.refreshToken.findUnique({
    where: { selector },
  });

  if (!record || record.revokedAt) return; // already revoked or not found

  const ok = await bcrypt.compare(rawToken, record.tokenHash);
  if (!ok) return; // token doesn't match — do nothing

  await db.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
}

// Expose for OAuth service
export { signAccessToken, createRefreshToken };