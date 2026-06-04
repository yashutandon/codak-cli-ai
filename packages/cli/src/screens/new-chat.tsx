import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "../providers/theme";
import { ErrorMessage } from "../components/messages/error-message";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ChatShell } from "../components/chat-shell/shell";
import { createSession } from "../clients/create-session/session.api";

const newChatStateSchema = z.object({
  message: z.string(),
});

export function NewChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors } = useTheme();
  const hasStartedRef = useRef(false);

  const state = useMemo(() => {
    const parsed = newChatStateSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (!state || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let ignore = false;

    const create = async () => {
      try {
        const session = await createSession({
          title: state.message.slice(0, 50),
          intialMessage: {
            role: "user",
            content: state.message,
            mode: "chat",
            model: "claude-opus-4.6",
          },
        });

        if (ignore) return;

        navigate(`/session/${session.id}`, {
          replace: true,
          state: { session },
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

    return () => {
      ignore = true;
    };
  }, [state, navigate]);

  if (!state) return null;

  return (
    <ChatShell onSubmit={() => {}} inputDisabled loading>
      <UserMessage message={state.message} />
      <BotMessage content="" model="claude-opus-4.6" />
    </ChatShell>
  );
}