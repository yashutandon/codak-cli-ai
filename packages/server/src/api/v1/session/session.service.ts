import { sessions } from "./session.store";
import type {
  CreateSessionDto,
  SessionDto,
} from "./session.dto";

export class SessionService {
  getAll(userId: string) {
    return sessions
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          b.createdAt.getTime() -
          a.createdAt.getTime()
      );
  }

  getById(id: string, userId: string) {
    return sessions.find(
      (s) => s.id === id && s.userId === userId
    );
  }

  create(
    data: CreateSessionDto,
    userId: string
  ): SessionDto {
    const session = {
      id: crypto.randomUUID(),
      title: data.title,
      userId,
      createdAt: new Date(),
    };

    sessions.push(session);

    return session;
  }
}

export const sessionService =
  new SessionService();