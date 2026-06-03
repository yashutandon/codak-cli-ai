import type {
  Request,
  Response,
} from "express";

import { sessionService } from "./session.service";
import { AppError } from "../../../utils/AppError";

type GetSessionParams = {
  id: string;
};

class SessionController {
  getAll = async (
    _req: Request,
    res: Response
  ) => {
    const userId = "user-1";

    const sessions =
      sessionService.getAll(userId);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  };

  getById = async (
    req: Request<GetSessionParams>,
    res: Response
  ) => {
    const userId = "user-1";

    const session =
      sessionService.getById(
        req.params.id,
        userId
      );

    if (!session) {
      throw new AppError(
        "Session not found",
        404
      );
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  };

  create = async (
    req: Request,
    res: Response
  ) => {
    const userId = "user-1";

    const session =
      sessionService.create(
        req.body,
        userId
      );

    return res.status(201).json({
      success: true,
      data: session,
    });
  };
}

export const sessionController =
  new SessionController();