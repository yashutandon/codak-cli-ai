import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../utils/AppError";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    error: {
      message: "Internal Server Error",
      statusCode: 500,
    },
  });
};