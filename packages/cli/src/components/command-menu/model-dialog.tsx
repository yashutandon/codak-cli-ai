import { useCallback } from "react"
import { SUPPORTED_CHAT_MODELS, type SupportedChatModelId } from "@codak/shared"
import { useTheme } from "../../providers/theme"
import { TextAttributes } from "@opentui/core"
import { DialogSearchList } from "../common/dialog-search-list"

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai:    "OpenAI",
  google:    "Google",
  groq:      "Groq (Free)",
}

type ModelEntry = typeof SUPPORTED_CHAT_MODELS[number]

type Props = {
  currentModel: SupportedChatModelId
  onSelect: (modelId: SupportedChatModelId) => void
}

export function ModelDialogContent({ currentModel, onSelect }: Props) {
  const { colors } = useTheme()

  const models = SUPPORTED_CHAT_MODELS as unknown as ModelEntry[]

  const handleSelect = useCallback((model: ModelEntry) => {
    onSelect(model.id as SupportedChatModelId)
  }, [onSelect])

  return (
    <DialogSearchList
      items={models}
      onSelect={handleSelect}
      filterFn={(model, query) =>
        model.id.toLowerCase().includes(query.toLowerCase()) ||
        model.provider.toLowerCase().includes(query.toLowerCase())
      }
      getKey={(model) => model.id}
      placeholder="Search models..."
      emptyText="No models match your search"
      renderItem={(model, isSelected) => {
        const isFree = model.pricing.inputUsedMillionTokens === 0
        const isCurrent = model.id === currentModel

        return (
          <>
            <text fg={isSelected ? colors.primary : colors.dimSeparator}>
              {isCurrent ? "◉" : isSelected ? "›" : " "}
            </text>
            <box flexGrow={1} flexShrink={1} overflow="hidden" paddingLeft={1}>
              <text
                fg={isSelected ? colors.thinking : isCurrent ? colors.primary : colors.info}
                attributes={isSelected || isCurrent ? TextAttributes.BOLD : TextAttributes.NONE}
              >
                {model.id}
              </text>
            </box>
            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
              {PROVIDER_LABELS[model.provider] ?? model.provider}
            </text>
            <text
              fg={isFree ? colors.success : colors.dimSeparator}
              attributes={TextAttributes.DIM}
            >
              {isFree
                ? " free"
                : ` $${model.pricing.inputUsedMillionTokens}/$${model.pricing.outputUsedMillionTokens}`}
            </text>
          </>
        )
      }}
    />
  )
}