import { useEffect, useState, useCallback } from "react"
import { TextAttributes } from "@opentui/core"
import { useTheme } from "../../providers/theme"
import { useDialog } from "../../providers/dialog"
import { getAllSessions } from "../../clients/create-session/session.api"
import { DialogSearchList } from "../common/dialog-search-list"
import type { Session } from "../../clients/create-session/session.types"
import type { NavigateFunction } from "react-router"

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
}

type Props = {
    navigate: NavigateFunction
}

export function SessionsDialogContent({ navigate }: Props) {
    const { colors } = useTheme()
    const { close } = useDialog()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false
        getAllSessions()
            .then((data) => {
                if (!ignore) {
                    setSessions(data)
                    setLoading(false)
                }
            })
            .catch(() => {
                if (!ignore) setLoading(false)
            })
        return () => { ignore = true }
    }, [])

    const openSession = useCallback((session: Session) => {
        close()
        navigate(`/session/${session.id}`, { state: { session } })
    }, [close, navigate])

    if (loading) {
        return (
            <box paddingY={1} flexDirection="row" gap={1} alignItems="center">
                <text fg={colors.dimSeparator}>◌</text>
                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                    Loading sessions...
                </text>
            </box>
        )
    }

    if (sessions.length === 0) {
        return (
            <box paddingY={1}>
                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                    No sessions found. Start a new chat!
                </text>
            </box>
        )
    }

    return (
        <DialogSearchList
            items={sessions}
            onSelect={openSession}
            filterFn={(session, query) =>
                session.title.toLowerCase().includes(query.toLowerCase())
            }
            getKey={(session) => session.id}
            placeholder="Search sessions..."
            emptyText="No sessions match your search"
            renderItem={(session, isSelected) => (
                <>
                    <text fg={colors.primary}>
                        {isSelected ? "›" : " "}
                    </text>
                    <box flexGrow={1} flexShrink={1} overflow="hidden" paddingLeft={1}>
                        <text
                            fg={isSelected ? colors.thinking : colors.primary}
                            attributes={isSelected ? TextAttributes.BOLD : undefined}
                        >
                            {session.title.length > 36
                                ? session.title.slice(0, 36) + "…"
                                : session.title}
                        </text>
                    </box>
                    <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
                        ⏱ {formatDate(session.createdAt)}
                    </text>
                </>
            )}
        />
    )
}