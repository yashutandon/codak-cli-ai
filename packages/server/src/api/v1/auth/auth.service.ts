import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@codak/database";
import { AppError } from "../../../utils/AppError";
import type { RegisterDto, LoginDto, AuthResponseDto } from "./auth.dto";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
const SALT_ROUNDS = 12;

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

  const accessToken = signToken(user.id);

  return { accessToken, user };
}

export async function login(data: LoginDto): Promise<AuthResponseDto> {
  const user = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, password: true, isOAuthUser: true },
  });

  // Use the same error message for user-not-found and wrong-password
  // to prevent user enumeration attacks
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

  const accessToken = signToken(user.id);

  return {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}