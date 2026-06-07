import { Router } from "express";
import { sendMessageHandler } from "./message.controller";

const messageRouter = Router({ mergeParams: true });

messageRouter.post("/", sendMessageHandler);

export default messageRouter;