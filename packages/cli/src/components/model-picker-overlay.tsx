import { useState } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "../providers/theme";
import { SUPPORTED_CHAT_MODELS, type SupportedChatModelId } from "@codak/shared";

const PROVIDER_ORDER = ["anthropic", "openai", "google", "groq"] as const;
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  groq: "Groq (Free)",
};
const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97706",
  openai: "#10b981",
  google: "#3b82f6",
  groq: "#8b5cf6",
};

type Props = {
  currentModel: SupportedChatModelId;
  onSelect: (modelId: SupportedChatModelId) => void;
  onClose: () => void;
};

export function ModelPickerOverlay({ currentModel, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [highlighted, setHighlighted] = useState<SupportedChatModelId>(currentModel);

  const grouped = PROVIDER_ORDER.map((provider) => ({
    provider,
    models: SUPPORTED_CHAT_MODELS.filter((m) => m.provider === provider),
  }));

  // Flat list of model IDs for keyboard nav
  const flatIds = SUPPORTED_CHAT_MODELS.map((m) => m.id as SupportedChatModelId);
  const currentIndex = flatIds.indexOf(highlighted);

  useKeyboard((key) => {
    if (key.name === "down" || key.name === "j") {
      const next = flatIds[(currentIndex + 1) % flatIds.length];
      if (next) setHighlighted(next);
    } else if (key.name === "up" || key.name === "k") {
      const prev = flatIds[(currentIndex - 1 + flatIds.length) % flatIds.length];
      if (prev) setHighlighted(prev);
    } else if (key.name === "return" || key.name === "enter" || key.name === "space") {
      onSelect(highlighted);
      onClose();
    } else if (key.name === "escape" || key.name === "q") {
      onClose();
    }
  });

  return (
    <box
      flexDirection="column"
      width={50}
      maxHeight={30}
      border={["top", "bottom", "left", "right"]}
      borderColor={colors.primary}
      backgroundColor={colors.background ?? "#080810"}
    >
      {/* Header */}
      <box
        flexDirection="row"
        justifyContent="space-between"
        paddingX={2}
        paddingY={0}
        backgroundColor={colors.surface}
      >
        <text fg={colors.primary} attributes={TextAttributes.BOLD}>
          Select Model
        </text>
        <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
          ESC to close
        </text>
      </box>

      {/* Model list */}
      <box flexDirection="column" paddingY={0} flexGrow={1} overflow="hidden">
        {grouped.map(({ provider, models }) => (
          <box key={provider} flexDirection="column">
            {/* Provider header */}
            <box paddingX={2} paddingTop={1}>
              <text
                fg={PROVIDER_COLORS[provider] ?? colors.primary}
                attributes={TextAttributes.BOLD}
              >
                {PROVIDER_LABELS[provider] ?? provider}
              </text>
            </box>

            {/* Models */}
            {models.map((m) => {
              const isActive = m.id === currentModel;
              const isHovered = m.id === highlighted;

              return (
                <box
                  key={m.id}
                  flexDirection="row"
                  justifyContent="space-between"
                  paddingX={3}
                  paddingY={0}
                  backgroundColor={isHovered ? colors.selection : undefined}
                >
                  <box flexDirection="row" gap={1}>
                    <text
                      fg={isActive ? colors.success : isHovered ? "#ffffff" : colors.dimSeparator}
                      attributes={isActive || isHovered ? TextAttributes.BOLD : TextAttributes.NONE}
                    >
                      {isActive ? "● " : isHovered ? "› " : "  "}
                      {m.displayName}
                    </text>
                  </box>
                  <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
                    {m.pricing.inputUsedMillionTokens === 0
                      ? "free"
                      : `$${m.pricing.inputUsedMillionTokens}/$${m.pricing.outputUsedMillionTokens}`}
                  </text>
                </box>
              );
            })}
          </box>
        ))}
      </box>

      <box paddingX={2} paddingBottom={1}>
        <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
          ↑↓ navigate · Enter select · Ctrl+M close
        </text>
      </box>
    </box>
  );
}
