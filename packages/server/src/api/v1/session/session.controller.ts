import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSessionCwd,
} from "./session.service";
import { CreateSessionSchema, UpdateSessionCwdSchema } from "./session.dto";
import { AppError } from "../../../utils/AppError";
import { getIndexingStatus } from "../../infra/embeddings/indexer.service";

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    const sessions = await getAllSessions(userId);
    res.status(200).json({ success: true, data: sessions });
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
    const userId = (req as unknown as AuthRequest).userId;
    const session = await getSessionById(req.params.id, userId);

    if (!session) return next(new AppError("Session not found", 404));

    res.status(200).json({ success: true, data: session });
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
    const userId = (req as AuthRequest).userId;
    const parsed = CreateSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const session = await createSession(parsed.data, userId);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function updateCwd(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    const parsed = UpdateSessionCwdSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.message, 400));
    }

    const session = await updateSessionCwd(req.params.id, userId, parsed.data.cwd);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /session/:id/indexing-status
 * Returns the current RAG indexing status for a session.
 * Used by the web dashboard to poll until indexing is complete.
 */
export async function getIndexingStatusHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as unknown as AuthRequest).userId;
    const session = await getSessionById(req.params.id, userId);
    if (!session) return next(new AppError("Session not found", 404));

    const status = await getIndexingStatus(req.params.id);
    res.status(200).json({ success: true, data: { status } });
  } catch (err) {
    next(err);
  }
}