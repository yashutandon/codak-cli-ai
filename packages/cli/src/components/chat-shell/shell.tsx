import { useState } from "react"
import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import type { ReactNode } from "react"
import { InputBar } from "../cli-input/input-bar"
import { Spinner } from "../common/spinner"
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@codak/shared"
import { useTheme } from "../../providers/theme"
import { ModelPickerOverlay } from "../model-picker-overlay"

type Mode = "BUILD" | "PLAN"

type Props = {
  children?: ReactNode
  onSubmit: (text: string) => void
  inputDisabled?: boolean
  loading?: boolean
  model?: SupportedChatModelId
  onModelChange?: (modelId: SupportedChatModelId) => void
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
  onModelChange,
  mode = "BUILD",
  onModeChange,
  sessionId,
  sessionCwd,
}: Props) {
  const { colors } = useTheme()
  const modeColor = mode === "PLAN" ? colors.planMode : colors.primary
  const [showModelPicker, setShowModelPicker] = useState(false)

  useKeyboard((key) => {
    if (key.ctrl && key.name === "m") {
      setShowModelPicker((s) => !s);
    }
  });

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
        <box gap={1} paddingBottom={1}>{children}</box>
      </scrollbox>

      {/* Ctrl+M model picker overlay */}
      {showModelPicker && (
        <box position="absolute" top={2} right={2} zIndex={10}>
          <ModelPickerOverlay
            currentModel={model}
            onSelect={(id) => { onModelChange?.(id); setShowModelPicker(false); }}
            onClose={() => setShowModelPicker(false)}
          />
        </box>
      )}

      <box flexShrink={0}>
        <InputBar
          onSubmit={onSubmit}
          disabled={inputDisabled}
          statusBar={{ model, interactionMode: mode }}
          onModeChange={() => onModeChange?.(mode === "BUILD" ? "PLAN" : "BUILD")}
          setMode={onModeChange}
          setModel={onModelChange}
          currentModel={model}
          sessionId={sessionId}
          sessionCwd={sessionCwd}
        />
      </box>

      <box
        flexShrink={0}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        height={1}
        gap={2}
        paddingLeft={1}
      >
        <box flexDirection="row" alignItems="center" gap={2} minWidth={2}>
          {loading ? <Spinner /> : <text fg={colors.dimSeparator}>{" "}</text>}
        </box>

        <box
          flexDirection="row"
          alignItems="center"
          gap={1}
          paddingX={1}
          backgroundColor={colors.surface}
        >
          <text fg={modeColor}>{mode === "PLAN" ? "◈" : "◉"}</text>
          <text
            fg={mode === "BUILD" ? colors.primary : colors.dimSeparator}
            attributes={mode === "BUILD" ? TextAttributes.BOLD : TextAttributes.NONE}
          >
            BUILD
          </text>
          <text fg={colors.dimSeparator}>·</text>
          <text
            fg={mode === "PLAN" ? colors.primary : colors.dimSeparator}
            attributes={mode === "PLAN" ? TextAttributes.BOLD : TextAttributes.NONE}
          >
            PLAN
          </text>
        </box>

        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto" alignItems="center">
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            ⇥
          </text>
          <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
            tab to toggle mode
          </text>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            {" · "}
          </text>
          <box flexDirection="row">
            <text
              fg={showModelPicker ? colors.primary : colors.dimSeparator}
              attributes={TextAttributes.DIM}
            >
              ^M model
            </text>
          </box>
        </box>
      </box>
    </box>
  )
}