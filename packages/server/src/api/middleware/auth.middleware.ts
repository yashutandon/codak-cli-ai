import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  userId: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized", 401));
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

    (req as AuthRequest).userId = payload.sub;

    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}