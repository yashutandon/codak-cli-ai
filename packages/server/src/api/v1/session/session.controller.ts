import type { Request, Response, NextFunction } from "express";

import {
  getAllSessions,
  getSessionById,
  createSession,
} from "./session.service";
import { CreateSessionSchema } from "./session.dto";
import { AppError } from "../../../utils/AppError";

// TODO: replace with real auth middleware
const TEMP_USER_ID = "user-1";

export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessions = getAllSessions(TEMP_USER_ID);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = getSessionById(req.params.id, TEMP_USER_ID);

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = CreateSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const session = createSession(parsed.data, TEMP_USER_ID);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}