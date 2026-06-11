import { TextAttributes } from "@opentui/core"
import type { ReactNode } from "react"
import { InputBar } from "../cli-input/input-bar"
import { Spinner } from "../common/spinner"
import { DEFAULT_CHAT_MODEL_ID } from "@codak/shared"
import { useTheme } from "../../providers/theme"

type Mode = "BUILD" | "PLAN"

type Props = {
  children?: ReactNode
  onSubmit: (text: string) => void
  inputDisabled?: boolean
  loading?: boolean
  model?: string
  mode?: Mode
  onModeChange?: (mode: Mode) => void
  sessionId?: string
  sessionCwd?: string | null
}

export function ChatShell({
  children,
  onSubmit,
  inputDisabled = false,
  loading = false,
  model = DEFAULT_CHAT_MODEL_ID,
  mode = "BUILD",
  onModeChange,
  sessionId,
  sessionCwd,
}: Props) {
  const { colors } = useTheme()

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      width="100%"
      height="100%"
      paddingY={1}
      paddingX={2}
      gap={1}
    >
      <scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
        <box gap={1}>{children}</box>
      </scrollbox>

      <box flexShrink={0}>
        <InputBar
          onSubmit={onSubmit}
          disabled={inputDisabled}
          statusBar={{ model }}
          onModeChange={() => onModeChange?.(mode === "BUILD" ? "PLAN" : "BUILD")}
          setMode={onModeChange}
          sessionId={sessionId}
          sessionCwd={sessionCwd}
        />
      </box>

      <box
        flexShrink={0}
        flexDirection="row"
        justifyContent="space-between"
        width="100%"
        height={1}
        gap={2}
        paddingLeft={1}
      >
        <box flexDirection="row" alignItems="center" gap={2}>
          {loading ? <Spinner /> : null}
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <text
            fg={mode === "BUILD" ? colors.primary : colors.dimSeparator}
            attributes={mode === "BUILD" ? TextAttributes.BOLD : TextAttributes.NONE}
          >
            BUILD
          </text>
          <text fg={colors.dimSeparator}>│</text>
          <text
            fg={mode === "PLAN" ? colors.primary : colors.dimSeparator}
            attributes={mode === "PLAN" ? TextAttributes.BOLD : TextAttributes.NONE}
          >
            PLAN
          </text>
        </box>

        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>mode</text>
        </box>
      </box>
    </box>
  )
}