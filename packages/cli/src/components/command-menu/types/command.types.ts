import type { NavigateFunction } from "react-router"
import type { DialogContextValue } from "../../../providers/dialog"
import type { ToastContextValue } from "../../../providers/toast"

export type CommandContext = {
  exit: () => void
  toast: ToastContextValue
  dialog: DialogContextValue
  navigate: NavigateFunction
  clearToken: () => Promise<void>
  sessionId?: string       // current session id 
  sessionCwd?: string | null  // current session cwd
}

export type Command = {
  name: string
  description: string
  value: string
  action?: (ctx: CommandContext) => void | Promise<void>
}