import { z } from "zod";

export const CreateSessionSchema = z.object({
  title: z.string().min(1),
});

export type CreateSessionDto =
  z.infer<typeof CreateSessionSchema>;

export interface SessionDto {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
}
export interface GetSessionParamsDto {
  id: string;
}