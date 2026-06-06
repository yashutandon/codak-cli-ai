import type { Request, Response, NextFunction } from "express";
import { register, login } from "./auth.service";
import { RegisterSchema, LoginSchema } from "./auth.dto";
import { AppError } from "../../../utils/AppError";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = RegisterSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const result = await register(parsed.data);

    res.status(201).json({
      success: true,
      data: result,
    });
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

    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const result = await login(parsed.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}