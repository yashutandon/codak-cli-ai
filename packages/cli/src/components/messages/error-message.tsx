import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { EmptyBorder } from "../common/border";

type Props = {
    message: string
}

export function ErrorMessage({ message }: Props) {
    const { colors } = useTheme();

    return (
        <box width="100%" alignItems="center">
            <box
                border={["left"]}
                customBorderChars={{
                    ...EmptyBorder,
                    vertical: "│",
                    bottomLeft: "╰",
                }}
                borderColor={colors.error}
                width="100%"
            >
                <box
                    flexDirection="row"
                    gap={1}
                    justifyContent="flex-start"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <text fg={colors.error} attributes={TextAttributes.BOLD}>✖</text>
                    <text attributes={TextAttributes.DIM}>{message}</text>
                </box>
            </box>
        </box>
    )
}