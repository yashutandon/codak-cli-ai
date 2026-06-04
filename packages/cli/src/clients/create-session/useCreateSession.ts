import { useMutation } from "@tanstack/react-query";
import { createSession } from "./session.api";
import type { CreateSessionPayload } from "./session.types";

export function useCreateSession() {
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => createSession(payload),
  });
}