import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import prettyMs from "pretty-ms";
import type { ToolCall, ToolResult } from "../../clients/message/message.api";

export type ToolCallWithResult = ToolCall & {
  result?: string;
  pending: boolean;
};

type Props = {
  content: string;
  model: string;
  toolCalls?: ToolCallWithResult[];
  streaming?: boolean;
  durationMs?: number;
};

const TOOL_LABELS: Record<string, string> = {
  read_file:        "Read file",
  write_file:       "Write file",
  list_files:       "List files",
  run_command:      "Run command",
  create_directory: "Create directory",
  delete_file:      "Delete file",
  search_files:     "Search files",
};

function ToolCallItem({ toolCall }: { toolCall: ToolCallWithResult }) {
  const { colors } = useTheme();
  const label = TOOL_LABELS[toolCall.toolName] ?? toolCall.toolName;

  const args = toolCall.args;
  const subtitle =
    (args.path as string) ??
    (args.command as string) ??
    (args.pattern as string) ??
    "";

  const shortSubtitle = subtitle.length > 40
    ? "…" + subtitle.slice(-38)
    : subtitle;

  const resultText = (() => {
    if (!toolCall.result) return "";
    const lines = toolCall.result.split("\n");
    const first = lines[0] ?? "";
    const truncated = first.length > 60 ? first.slice(0, 60) + "…" : first;
    return lines.length > 1 ? truncated + " …" : truncated;
  })();

  return (
    <box flexDirection="column" width="100%" paddingX={3}>
      <box flexDirection="row" gap={1} alignItems="center">
        <text fg={toolCall.pending ? colors.planMode : colors.success}>
          {toolCall.pending ? "◌" : "✓"}
        </text>
        <text fg={colors.info} attributes={TextAttributes.BOLD}>
          {label}
        </text>
        {shortSubtitle ? (
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            {shortSubtitle}
          </text>
        ) : null}
      </box>

      {!toolCall.pending && resultText ? (
        <box paddingLeft={3}>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            {resultText}
          </text>
        </box>
      ) : null}
    </box>
  );
}

export function BotMessage({
  content,
  model,
  toolCalls = [],
  streaming = false,
  durationMs,
}: Props) {
  const { colors } = useTheme();

  // Cursor shown as separate sibling text node, not nested
  const displayContent = streaming ? content + "▌" : content;

  return (
    <box width="100%" flexDirection="column">
      {/* Tool calls */}
      {toolCalls.length > 0 && (
        <box flexDirection="column" width="100%" paddingTop={1} gap={0}>
          {toolCalls.map((tc) => (
            <ToolCallItem key={tc.toolCallId} toolCall={tc} />
          ))}
        </box>
      )}

      {/* Text content */}
      {(content || streaming) && (
        <box paddingY={1} width="100%">
          <box paddingX={3} width="100%">
            <text wrapMode="word">
              {displayContent}
            </text>
          </box>
        </box>
      )}

      {/* Footer */}
      <box paddingX={3} paddingBottom={1} width="100%">
        <box flexDirection="row" gap={2} alignItems="center">
          <text fg={colors.primary}>◉</text>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            {model}
          </text>
          {durationMs !== undefined ? (
            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
              {"· " + prettyMs(durationMs)}
            </text>
          ) : null}
        </box>
      </box>
    </box>
  );
}