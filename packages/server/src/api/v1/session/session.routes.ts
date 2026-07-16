import { Router } from "express";
import { getAll, getById, create, updateCwd, getIndexingStatusHandler } from "./session.controller";

const sessionRouter = Router();

sessionRouter.get("/", getAll);
sessionRouter.get("/:id/indexing-status", getIndexingStatusHandler);
sessionRouter.get("/:id", getById);
sessionRouter.post("/", create);
sessionRouter.patch("/:id", updateCwd);

export default sessionRouter;