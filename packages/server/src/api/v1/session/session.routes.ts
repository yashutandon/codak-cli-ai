import { Router } from "express";
import { getAll, getById, create, updateCwd } from "./session.controller";

const sessionRouter = Router();

sessionRouter.get("/", getAll);
sessionRouter.get("/:id", getById);
sessionRouter.post("/", create);
sessionRouter.patch("/:id", updateCwd);

export default sessionRouter;