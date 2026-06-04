import { Router } from "express";
import { getAll, getById, create } from "./session.controller";

const sessionRouter = Router();

sessionRouter.get("/", getAll);
sessionRouter.get("/:id", getById);
sessionRouter.post("/", create);

export default sessionRouter;