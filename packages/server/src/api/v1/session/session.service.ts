import { sessions } from "./session.store";
import type { CreateSessionDto, SessionDto, Mesage } from "./session.dto";

export function getAllSessions(userId: string): SessionDto[] {
  return sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getSessionById(
  id: string,
  userId: string
): SessionDto | undefined {
  return sessions.find((s) => s.id === id && s.userId === userId);
}

export function createSession(
  data: CreateSessionDto,
  userId: string
): SessionDto {
  const sessionId = crypto.randomUUID();

  const messages: Mesage[] = data.intialMessage
    ? [
        {
          id: crypto.randomUUID(),
          role: data.intialMessage.role,
          title: "",
          content: data.intialMessage.content,
          status: "sent",
          part: null,
          mode: data.intialMessage.mode,
          model: data.intialMessage.model,
          duration: null,
          createdAt: new Date(),
          sessionId,
        },
      ]
    : [];

  const session: SessionDto = {
    id: sessionId,
    title: data.title,
    cwd: data.cwd ?? null,
    userId,
    createdAt: new Date(),
    messages,
  };

  sessions.push(session);

  return session;
}