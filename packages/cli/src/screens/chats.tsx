import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { useTheme } from "../providers/theme";
import { ChatShell } from "../components/chat-shell/shell";
import { UserMessage } from "../components/messages/user-message";
import { BotMessage } from "../components/messages/bot-message";
import { ErrorMessage } from "../components/messages/error-message";
import { getSessionById } from "../clients/create-session/session.api";
import type { Session } from "../clients/create-session/session.types";

const sessionLocationSchema = z.object({
  session: z.custom<Session>(
    (val) => val != null && typeof val === "object" && "id" in val
  ),
});

export function Chat() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const prefetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const [session, setSession] = useState<Session | null>(
    prefetched?.session ?? null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // session already passed from NewChat via navigate state — skip fetch
    if (prefetched?.session) return;

    setSession(null);
    setError(null);

    if (!id) return;

    let ignore = false;

    const fetchSession = async () => {
      try {
        const data = await getSessionById(id);
        if (ignore) return;
        setSession(data);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : "Failed to load session"
        );
        navigate("/", { replace: true });
      }
    };

    fetchSession();

    return () => {
      ignore = true;
    };
  }, [id, prefetched, navigate]);

  if (!session) {
    return <ChatShell onSubmit={() => {}} inputDisabled loading />;
  }

  return (
    <ChatShell onSubmit={() => {}} inputDisabled={false} loading={false}>
      {session.messages.map((msg) => {
        if (msg.role === "user") {
          return <UserMessage key={msg.id} message={msg.content} />;
        }
        // return (
        //   <BotMessage  content="hello there" model="opus-4.6" />
        // );
      })}
       <BotMessage  content="hello there" model="opus-4.6" />
      {error && <ErrorMessage message={error} />}
    </ChatShell>
  );
}