import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import prettyMs from "pretty-ms";
import type { ToolCall, ToolResult } from "../../clients/message/message.api";
import { RoundedBorder } from "../common/border";

export type ToolCallWithResult = ToolCall & {
  result?: string;
  pending: boolean;
};

type Mode = "BUILD" | "PLAN";

type Props = {
  content: string;
  model: string;
  mode?: Mode;
  toolCalls?: ToolCallWithResult[];
  streaming?: boolean;
  durationMs?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd?: number;
  };
};

const TOOL_LABELS: Record<string, string> = {
  read_file:        "Read file",
  write_file:       "Write file",
  edit_file:        "Edit file",
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
    <box
      flexDirection="column"
      width="100%"
      paddingX={2}
      paddingLeft={1}
    >
      <box flexDirection="row" gap={1} alignItems="center">
        <text fg={colors.dimSeparator}>{"├─"}</text>
        <text fg={toolCall.pending ? colors.planMode : colors.success}>
          {toolCall.pending ? "◌" : "●"}
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
        <box paddingLeft={4}>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            │  {resultText}
          </text>
        </box>
      ) : null}
    </box>
  );
}

type MdLine =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "numbered"; text: string; num: string }
  | { type: "code"; text: string }
  | { type: "hr" }
  | { type: "blank" }
  | { type: "text"; text: string };

function parseLine(line: string): MdLine {
  if (/^#{3}\s+/.test(line)) return { type: "h3", text: line.replace(/^#{3}\s+/, "") };
  if (/^#{2}\s+/.test(line)) return { type: "h2", text: line.replace(/^#{2}\s+/, "") };
  if (/^#\s+/.test(line))    return { type: "h1", text: line.replace(/^#\s+/, "") };
  if (/^---+$/.test(line.trim())) return { type: "hr" };
  if (line.trim() === "")    return { type: "blank" };

  const bulletMatch = line.match(/^(\s*)[*\-+]\s+(.*)/);
  if (bulletMatch) return { type: "bullet", text: bulletMatch[2]!, indent: bulletMatch[1]!.length };

  const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
  if (numberedMatch) return { type: "numbered", text: numberedMatch[3]!, num: numberedMatch[2]! };

  const codeMatch = line.match(/^`{3}.*$/);
  if (codeMatch) return { type: "code", text: "" };

  return { type: "text", text: line };
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

function MarkdownContent({
  content,
  streaming,
  mode,
}: {
  content: string;
  streaming: boolean;
  mode: Mode;
}) {
  const { colors } = useTheme();

  const rawLines = content.split("\n");
  const lines = rawLines.map(parseLine);

  let inCodeBlock = false;
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const key = String(i);

    if (line.type === "code") {
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      elements.push(
        <box key={key} width="100%" paddingLeft={1} paddingRight={1}>
          <box 
            backgroundColor={colors.surface} 
            width="100%" 
            paddingLeft={1}
            border={["left"]}
            borderColor={colors.primary}
          >
            <text fg={colors.thinking}>
              {(line.type === "text" ? line.text : "")}
            </text>
          </box>
        </box>
      );
      return;
    }

    if (line.type === "blank") {
      elements.push(<text key={key}>{" "}</text>);
      return;
    }

    if (line.type === "hr") {
      elements.push(
        <box key={key} paddingY={1}>
          <text fg={colors.dimSeparator}>{"────────────────────────────────────────"}</text>
        </box>
      );
      return;
    }

    if (line.type === "h1") {
      elements.push(
        <box key={key} flexDirection="row" gap={1} alignItems="center" paddingY={1}>
          <text fg={mode === "PLAN" ? colors.planMode : colors.primary}>█</text>
          <text fg={mode === "PLAN" ? colors.planMode : colors.primary} attributes={TextAttributes.BOLD}>
            {stripInline(line.text)}
          </text>
        </box>
      );
      return;
    }

    if (line.type === "h2") {
      elements.push(
        <text key={key} fg={colors.info} attributes={TextAttributes.BOLD}>
          {stripInline(line.text)}
        </text>
      );
      return;
    }

    if (line.type === "h3") {
      elements.push(
        <text key={key} attributes={TextAttributes.BOLD}>
          {stripInline(line.text)}
        </text>
      );
      return;
    }

    if (line.type === "bullet") {
      const prefix = "  ".repeat(Math.floor(line.indent / 2)) + "› ";
      elements.push(
        <text key={key} wrapMode="word">
          {prefix + stripInline(line.text)}
        </text>
      );
      return;
    }

    if (line.type === "numbered") {
      elements.push(
        <text key={key} wrapMode="word">
          {"  " + line.num + ". " + stripInline(line.text)}
        </text>
      );
      return;
    }

    const isLast = i === lines.length - 1;
    const text = stripInline(line.type === "text" ? line.text : "");
    const display = streaming && isLast ? text + "▌" : text;

    elements.push(
      <text key={key} wrapMode="word">
        {display}
      </text>
    );
  });

  if (streaming && lines[lines.length - 1]?.type === "blank") {
    elements.push(<text key="cursor">{"▌"}</text>);
  }

  return (
    <box flexDirection="column" width="100%">
      {elements}
    </box>
  );
}

export function BotMessage({
  content,
  model,
  mode = "BUILD",
  toolCalls = [],
  streaming = false,
  durationMs,
  tokenUsage,
}: Props) {
  const { colors } = useTheme();

  const modeColor = mode === "PLAN" ? colors.planMode : colors.primary;

  return (
    <box width="100%" flexDirection="column">
      {toolCalls.length > 0 && (
        <box
          flexDirection="column"
          width="100%"
          paddingTop={1}
          paddingBottom={1}
          gap={0}
        >
          {toolCalls.map((tc, index) => (
            <box key={tc.toolCallId} flexDirection="column">
              <ToolCallItem toolCall={tc} />
              {index === toolCalls.length - 1 && (
                <box paddingLeft={1}>
                  <text fg={colors.dimSeparator}>{"└─"}</text>
                </box>
              )}
            </box>
          ))}
        </box>
      )}

      {(content || streaming) && (
        <box paddingY={1} paddingX={3} width="100%">
          <MarkdownContent content={content} streaming={streaming} mode={mode} />
        </box>
      )}

      <box paddingX={3} paddingBottom={1} width="100%">
        <box flexDirection="row" gap={2} alignItems="center">
          <text fg={modeColor}>
            {mode === "PLAN" ? "◈" : "◉"}
          </text>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
            {model}
          </text>
          {mode === "PLAN" && (
            <text fg={colors.planMode} attributes={TextAttributes.DIM}>
              · plan
            </text>
          )}
          {durationMs !== undefined ? (
            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
              {"· " + prettyMs(durationMs)}
            </text>
          ) : null}
          {tokenUsage && !streaming ? (
            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
              {`· ${tokenUsage.totalTokens.toLocaleString()} tok`}
              {tokenUsage.costUsd !== undefined && tokenUsage.costUsd > 0
                ? ` · $${tokenUsage.costUsd.toFixed(4)}`
                : ""}
            </text>
          ) : null}
        </box>
      </box>
    </box>
  );
}