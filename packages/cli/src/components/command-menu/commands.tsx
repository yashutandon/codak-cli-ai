import { ThemeDialogContent } from "../theme/theme-dialog"
import { SessionsDialogContent } from "./session-dialog"
import { SetPathDialogContent } from "./setpath-dialog"
import { clearToken } from "../../auth"
import { updateSessionCwd } from "../../clients/create-session/session.api"
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

  // ── Mode ─────────────────────────────────────────────────────
  {
    name: "Build Mode",
    description: "Switch to BUILD mode — agent writes and executes code",
    value: "@build",
    action: (ctx) => {
      ctx.setMode?.("BUILD")
      ctx.toast.show({
        message: "Switched to BUILD mode",
        variant: "success",
      })
    },
  },
  {
    name: "Plan Mode",
    description: "Switch to PLAN mode — agent analyzes and creates a plan",
    value: "@plan",
    action: (ctx) => {
      ctx.setMode?.("PLAN")
      ctx.toast.show({
        message: "Switched to PLAN mode",
        variant: "success",
      })
    },
  },

  // ── Project ──────────────────────────────────────────────────
  {
    name: "Set Path",
    description: "Set project working directory for current session",
    value: "@setpath",
    action: (ctx) => {
      if (!ctx.sessionId) {
        ctx.toast.show({
          message: "Open a session first to set path",
          variant: "error",
        })
        return
      }

      ctx.dialog.open({
        title: "Set Project Path",
        children: (
          <SetPathDialogContent
            currentCwd={ctx.sessionCwd}
            onConfirm={async (path) => {
              try {
                await updateSessionCwd(ctx.sessionId!, path)
                ctx.toast.show({
                  message: `Path set to: ${path}`,
                  variant: "success",
                })
              } catch (err) {
                ctx.toast.show({
                  message: err instanceof Error ? err.message : "Failed to update path",
                  variant: "error",
                })
              }
            }}
          />
        ),
      })
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