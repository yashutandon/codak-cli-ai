/** @jsxImportSource @opentui/react */

import { TextAttributes } from "@opentui/core"
import { getAppSlot } from "../../helpers/slot-registry"
import { useTheme } from "../../providers/theme"
import { DEFAULT_CHAT_MODEL_ID } from "@codak/shared"

export type StatusBarProps = {
  model?: string
  interactionMode?: string
}

export function StatusBar({
  model = DEFAULT_CHAT_MODEL_ID,
  interactionMode = "Build",
}: StatusBarProps) {
  const AppSlot = getAppSlot()

  return (
    <box
      flexDirection="row"
      alignItems="center"
      flexShrink={0}
      flexGrow={0}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      <AppSlot
        name="statusbar_left"
        model={model}
        interactionMode={interactionMode}
        mode="replace"
      >
        <DefaultStatusLeft model={model} interactionMode={interactionMode} />
      </AppSlot>

      <AppSlot
        name="statusbar_right"
        model={model}
        interactionMode={interactionMode}
        mode="append"
      />
    </box>
  )
}

function DefaultStatusLeft({
  model,
  interactionMode,
}: Required<StatusBarProps>) {
  const { colors } = useTheme()
  const isPlan = interactionMode.toUpperCase() === "PLAN"

  return (
    <box
      flexDirection="row"
      gap={1}
      alignItems="center"
      paddingX={1}
      backgroundColor={colors.surface}
    >
      <text fg={isPlan ? colors.planMode : colors.primary}>
        {isPlan ? "◈" : "◉"}
      </text>
      <text
        fg={isPlan ? colors.planMode : colors.primary}
        attributes={TextAttributes.BOLD}
      >
        {interactionMode}
      </text>
      <text fg={colors.dimSeparator}>›</text>
      <text fg={colors.info}>{model}</text>
    </box>
  )
}