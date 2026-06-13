import type { NavigateFunction } from "react-router"
import type { DialogContextValue } from "../../../providers/dialog"
import type { ToastContextValue } from "../../../providers/toast"
import type { SupportedChatModelId } from "@codak/shared"

type Mode = "BUILD" | "PLAN"

export type CommandContext = {
  exit: () => void
  toast: ToastContextValue
  dialog: DialogContextValue
  navigate: NavigateFunction
  clearToken: () => Promise<void>
  sessionId?: string
  sessionCwd?: string | null
  setMode?: (mode: Mode) => void
   currentModel?: SupportedChatModelId
  setModel?: (modelId: SupportedChatModelId) => void
}

export type Command = {
  name: string
  description: string
  value: string
  action?: (ctx: CommandContext) => void | Promise<void>
}