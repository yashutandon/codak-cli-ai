/** @jsxImportSource @opentui/react */

import { TextAttributes } from "@opentui/core"
import { getAppSlot } from "../../helpers/slot-registry"

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
  return (
    <box flexDirection="row" gap={1} alignItems="center">
      <text fg="cyan" attributes={TextAttributes.BOLD}>
        {interactionMode}
      </text>
      <text attributes={TextAttributes.DIM} fg="gray">
        &gt;
      </text>
      <text fg="#E0E0F0">{model}</text>
    </box>
  )
}