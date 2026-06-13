import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ChatShell } from "../components/chat-shell/shell";
import { createSession } from "../clients/create-session/session.api";
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@codak/shared";

const newChatStateSchema = z.object({
  message: z.string(),
  model: z.string().optional(),
});

export function NewChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasStartedRef = useRef(false);

  const state = useMemo(() => {
    const parsed = newChatStateSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const model = (state?.model as SupportedChatModelId) ?? DEFAULT_CHAT_MODEL_ID;

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    if (!state || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let ignore = false;

    const create = async () => {
      try {
        const session = await createSession({
          title: state.message.slice(0, 50),
          cwd: process.cwd(),
          intialMessage: {
            role: "USER",
            content: state.message,
            mode: "BUILD",
            model,
          },
        });

        if (ignore) return;

        navigate(`/session/${session.id}`, {
          replace: true,
          state: { session, model },
        });
      } catch (error) {
        if (ignore) return;
        navigate("/", {
          replace: true,
          state: {
            error: error instanceof Error ? error.message : "Failed to create session",
          },
        });
      }
    };

    create();
    return () => { ignore = true; };
  }, [state, navigate, model]);

  if (!state) return null;

  return (
    <ChatShell onSubmit={() => {}} inputDisabled loading>
      <UserMessage message={state.message} />
      <BotMessage content="" model={model} />
    </ChatShell>
  );
}