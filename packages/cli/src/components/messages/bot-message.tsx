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

// Markdown line types
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

// Strip inline markdown (**bold**, *italic*, `code`, ~~strike~~)
function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

function MarkdownContent({ content, streaming }: { content: string; streaming: boolean }) {
  const { colors } = useTheme();

  const rawLines = content.split("\n");
  const lines = rawLines.map(parseLine);

  let inCodeBlock = false;
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const key = String(i);

    // Toggle code block
    if (line.type === "code") {
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      elements.push(
        <text key={key} fg={colors.success}>
          {"  " + (line.type === "text" ? line.text : "")}
        </text>
      );
      return;
    }

    if (line.type === "blank") {
      elements.push(<text key={key}>{" "}</text>);
      return;
    }

    if (line.type === "hr") {
      elements.push(
        <text key={key} fg={colors.dimSeparator}>{"─────────────────────"}</text>
      );
      return;
    }

    if (line.type === "h1") {
      elements.push(
        <text key={key} fg={colors.primary} attributes={TextAttributes.BOLD}>
          {stripInline(line.text)}
        </text>
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
      const prefix = "  ".repeat(Math.floor(line.indent / 2)) + "• ";
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

    // Plain text — last line gets cursor if streaming
    const isLast = i === lines.length - 1;
    const text = stripInline(line.type === "text" ? line.text : "");
    const display = streaming && isLast ? text + "▌" : text;

    elements.push(
      <text key={key} wrapMode="word">
        {display}
      </text>
    );
  });

  // Streaming cursor on blank last line
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
  toolCalls = [],
  streaming = false,
  durationMs,
}: Props) {
  const { colors } = useTheme();

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

      {/* Markdown content */}
      {(content || streaming) && (
        <box paddingY={1} paddingX={3} width="100%">
          <MarkdownContent content={content} streaming={streaming} />
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