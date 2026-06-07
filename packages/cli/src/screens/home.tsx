import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "../providers/theme";
import { InputBar } from "../components/cli-input/input-bar";
import { Header } from "../components/layout/header";
import { getAllSessions } from "../clients/create-session/session.api";
import type { Session } from "../clients/create-session/session.types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function Home() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);



  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/session/new", { state: { message: text } });
    },
    [navigate]
  );

  return (
    <box gap={2} position="relative" width="100%" height="100%">
      <Header />

      {sessions.length > 0 && (
        <box flexDirection="column" width="100%" paddingX={2}>
          <text fg={colors.primary} attributes={TextAttributes.DIM}>
            Recent Sessions
          </text>

          <box flexDirection="column" width="100%" marginTop={1}>
            {sessions.slice(0, 8).map((session, index) => (
              <box
                key={session.id}
                width="100%"
                flexDirection="row"
                gap={2}
                paddingX={1}
                backgroundColor={
                  selectedIndex === index ? colors.surface : undefined
                }
              >
                <text fg={colors.primary}>
                  {selectedIndex === index ? "›" : " "}
                </text>
                <text fg={colors.primary} flexGrow={1}>
                  {session.title.length > 50
                    ? session.title.slice(0, 50) + "..."
                    : session.title}
                </text>
                <text attributes={TextAttributes.DIM}>
                  {formatDate(session.createdAt)}
                </text>
              </box>
            ))}
          </box>
        </box>
      )}

      <box width="100%">
        <InputBar onSubmit={handleSubmit} />
      </box>
    </box>
  );
}