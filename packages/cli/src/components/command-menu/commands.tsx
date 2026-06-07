import { ThemeDialogContent } from "../theme/theme-dialog"
import { SessionsDialogContent } from "./session-dialog"
import { clearToken } from "../../auth"
import type { Command } from "./types/command.types"
import { HelpDialogContent } from "./help-dialog"

export const COMMANDS: Command[] = [
    // ── Conversation ─────────────────────────────────────────────
    {
        name: "New Conversation",
        description: "Start a new conversation",
        value: "@new",
        action: (ctx) => {
            ctx.navigate("/", { replace: false })
        },
    },
    {
        name: "Open Conversation",
        description: "Browse and open an existing session",
        value: "@open",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Open Session",
                children: <SessionsDialogContent navigate={ctx.navigate} />,
            })
        },
    },
    {
        name: "Close Conversation",
        description: "Go back to home screen",
        value: "@close",
        action: (ctx) => {
            ctx.navigate("/", { replace: true })
        },
    },

    // ── Auth ─────────────────────────────────────────────────────
    {
        name: "Logout",
        description: "Sign out and clear saved token",
        value: "@logout",
        action: async (ctx) => {
            await clearToken()
            ctx.toast.show({
                message: "Logged out. Restart the CLI to sign in again.",
                variant: "info",
            })
        },
    },

    // ── Theme ────────────────────────────────────────────────────
    {
        name: "Theme",
        description: "Change color theme",
        value: "@theme",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Theme",
                children: <ThemeDialogContent />,
            })
        },
    },

    // ── App ──────────────────────────────────────────────────────
    {
        name: "Help",
        description: "Show available commands",
        value: "@help",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Available Commands",
                children: <HelpDialogContent />,
            })
        },
    },
    {
        name: "Exit",
        description: "Exit the application",
        value: "@exit",
        action: (ctx) => {
            ctx.exit()
        },
    },
]

