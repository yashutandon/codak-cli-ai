import { db } from "@codak/database";
import { indexCodebase } from "../../infra/embeddings";
import type { CreateSessionDto, SessionDto, Mesage } from "./session.dto";
import { AppError } from "../../../utils/AppError";

export async function getAllSessions(userId: string): Promise<SessionDto[]> {
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { messages: true },
  });

  return sessions.map(toSessionDto);
}

export async function getSessionById(
  id: string,
  userId: string
): Promise<SessionDto | null> {
  const session = await db.session.findFirst({
    where: { id, userId },
    include: { messages: true },
  });

  if (!session) return null;

  return toSessionDto(session);
}

export async function createSession(
  data: CreateSessionDto,
  userId: string
): Promise<SessionDto> {
  const session = await db.session.create({
    data: {
      title: data.title,
      cwd: data.cwd ?? null,
      userId,
      messages: data.intialMessage
        ? {
            create: {
              role: data.intialMessage.role,
              content: data.intialMessage.content,
              mode: data.intialMessage.mode,
              model: data.intialMessage.model,
              title: "",
              status: "COMPLETE",
            },
          }
        : undefined,
    },
    include: { messages: true },
  });

  if (session.cwd) {
    indexCodebase(session.id, session.cwd).catch((err) =>
      console.error("[RAG] Background indexing failed:", err)
    );
  }

  return toSessionDto(session);
}

export async function updateSessionCwd(
  id: string,
  userId: string,
  cwd: string
): Promise<SessionDto> {
  const session = await db.session.findFirst({
    where: { id, userId },
  });

  if (!session) throw new AppError("Session not found", 404);

  const updated = await db.session.update({
    where: { id },
    data: { cwd },
    include: { messages: true },
  });

  // Reindex on path change
  indexCodebase(updated.id, cwd).catch((err) =>
    console.error("[RAG] Reindex on cwd change failed:", err)
  );

  return toSessionDto(updated);
}

function toSessionDto(session: any): SessionDto {
  return {
    id: session.id,
    title: session.title,
    cwd: session.cwd ?? null,
    userId: session.userId,
    createdAt: session.createdAt,
    messages: session.messages.map(
      (m: any): Mesage => ({
        id: m.id,
        role: m.role,
        title: m.title,
        content: m.content,
        status: m.status,
        part: m.part ?? null,
        mode: m.mode,
        model: m.model,
        duration: m.duration ?? null,
        createdAt: m.createdAt,
        sessionId: m.sessionId,
      })
    ),
  };
}