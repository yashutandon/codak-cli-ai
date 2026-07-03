import type { Request, Response, NextFunction } from "express";
import { register, login, refreshAccessToken, revokeRefreshToken } from "./auth.service";
import { RegisterSchema, LoginSchema } from "./auth.dto";
import { AppError } from "../../../utils/AppError";
import { z } from "zod";

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.message, 400));

    const result = await register(parsed.data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.message, 400));

    const result = await login(parsed.data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError("refreshToken is required", 400));

    const result = await refreshAccessToken(parsed.data.refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (parsed.success) {
      await revokeRefreshToken(parsed.data.refreshToken).catch(() => {});
    }
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}