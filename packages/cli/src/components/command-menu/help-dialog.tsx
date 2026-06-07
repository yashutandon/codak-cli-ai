// ── Help dialog ───────────────────────────────────────────────────────────────

import { TextAttributes } from "@opentui/core"
import { useTheme } from "../../providers/theme"
import { COMMANDS } from "./commands"

export function HelpDialogContent() {
    const { colors } = useTheme()
    return (
        <box flexDirection="column" gap={0} width="100%">
            <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                Type @ in the input bar to open the command menu
            </text>
            <box flexDirection="column" marginTop={1} width="100%" gap={0}>
                {COMMANDS.map((cmd) => (
                    <box key={cmd.value} flexDirection="row" gap={2} width="100%">
                        <text fg={colors.info} width={18}>
                            {cmd.value}
                        </text>
                        <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
                            {cmd.description}
                        </text>
                    </box>
                ))}
            </box>
        </box>
    )
}