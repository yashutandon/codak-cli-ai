import { findSupportedChatModel } from "@codak/shared";
import { z } from "zod";

export const CreateSessionSchema = z.object({
  title: z.string(),
  cwd:z.string().optional(),
  intialMessage:z.object({
    role:z.string(),
    content:z.string(),
    mode:z.string(),
    model:z.string().refine((id)=>!!findSupportedChatModel(id),"Unsupported model")
  }).optional()
});

export type CreateSessionDto =
  z.infer<typeof CreateSessionSchema>;

export interface Mesage{
    id: string;
  role:string;
  title: string;
  content:string;
  status:string;
  part:null;
  mode:string;
  model:string;
  duration:null;
  createdAt: Date;
  sessionId:string;
}


export interface SessionDto {
  id:string;
    title:string;
    cwd:string|null;
    userId:string;
    createdAt:Date;
    messages:Mesage[];
}

export interface GetSessionParamsDto {
  id: string;
}


