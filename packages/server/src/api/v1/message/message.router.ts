import { Router } from "express";
import { sendMessageHandler, approvalHandler } from "./message.controller";

const messageRouter = Router({ mergeParams: true });

messageRouter.post("/", sendMessageHandler);
messageRouter.post("/approve", approvalHandler);

export default messageRouter;