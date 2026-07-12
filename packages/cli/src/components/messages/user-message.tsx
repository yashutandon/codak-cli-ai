import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { RoundedBorder } from "../common/border";

type Props = {
    message: string
}

export function UserMessage({ message }: Props) {
    const { colors } = useTheme();

    return (
        <box width="100%" alignItems="center">
            <box
                border={["top", "bottom", "left", "right"]}
                customBorderChars={RoundedBorder}
                borderColor={colors.selection}
                width="100%"
            >
                <box
                    flexDirection="row"
                    gap={2}
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <text fg={colors.primary} attributes={TextAttributes.BOLD}>👤</text>
                    <text fg={colors.dimSeparator} attributes={TextAttributes.BOLD}>|</text>
                    <text>{message}</text>
                </box>
            </box>
        </box>
    )
}