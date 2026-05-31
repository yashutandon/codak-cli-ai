/** @jsxImportSource @opentui/react */

import { TextAttributes } from "@opentui/core"
import { getAppSlot } from "../../helpers/slot-registry"
import { useTheme } from "../../providers/theme"

export type StatusBarProps = {
  model?: string
  interactionMode?: string
}

export function StatusBar({
  model = "opus-4.6",
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
  return (
    <box flexDirection="row" gap={1} alignItems="center">
      <text fg={colors.primary} attributes={TextAttributes.BOLD}>
        {interactionMode}
      </text>
      <text fg={colors.dimSeparator}>
        &gt;
      </text>
      <text fg={colors.info}>{model}</text>
    </box>
  )
}