import { useState, useCallback } from "react";
import { useTheme } from "../providers/theme";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";

type Props = {
  toolName: string;
  args: Record<string, unknown>;
  onApprove: () => void;
  onReject: () => void;
};

export function ToolApprovalPrompt({ toolName, args, onApprove, onReject }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<"approve" | "reject">("approve");

  useKeyboard((key) => {
    if (key.name === "y") {
      onApprove();
    } else if (key.name === "n" || key.name === "escape") {
      onReject();
    }
  });

  // Format args for display
  const argsPreview = (() => {
    const val = args.command ?? args.path ?? args.branch ?? args.message ?? "";
    const str = String(val);
    return str.length > 60 ? str.slice(0, 57) + "…" : str;
  })();

  return (
    <box
      flexDirection="column"
      width="100%"
      padding={2}
      border={["top", "bottom", "left", "right"]}
      borderColor="#f59e0b"
      gap={1}
    >
      {/* Header */}
      <box flexDirection="row" gap={2} alignItems="center">
        <text fg="#f59e0b" attributes={TextAttributes.BOLD}>
          ⚠  APPROVAL REQUIRED — Tool wants to execute:
        </text>
      </box>

      {/* Tool info */}
      <box flexDirection="column" paddingLeft={1} gap={0}>
        <box flexDirection="row" gap={1}>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>tool:</text>
          <text fg={colors.info} attributes={TextAttributes.BOLD}>{toolName}</text>
        </box>
        {argsPreview && (
          <box flexDirection="row" gap={1}>
            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>args:</text>
            <text fg={colors.dimSeparator}>{argsPreview}</text>
          </box>
        )}
      </box>

      {/* Keyboard prompt */}
      <box flexDirection="row" gap={3} paddingLeft={1} paddingTop={1}>
        <text
          fg={colors.success}
          attributes={TextAttributes.BOLD}
        >
          [Y] Approve
        </text>
        <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>|</text>
        <text
          fg="#ef4444"
          attributes={TextAttributes.BOLD}
        >
          [N] Reject
        </text>
      </box>

      <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
        Press Y to approve or N/Escape to reject
      </text>
    </box>
  );
}
