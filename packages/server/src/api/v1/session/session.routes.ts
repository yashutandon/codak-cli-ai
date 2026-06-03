import { Router } from "express";

import { sessionController } from "./session.controller";

export const sessionRouter =
  Router();

sessionRouter.get(
  "/",
  sessionController.getAll
);

sessionRouter.get(
  "/:id",
  sessionController.getById
);

sessionRouter.post(
  "/",
  sessionController.create
);