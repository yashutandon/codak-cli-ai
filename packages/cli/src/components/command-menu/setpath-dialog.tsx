import { useState, useCallback, useRef, useEffect } from "react"
import { EditBufferRenderable, InputRenderable, TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useTheme } from "../../providers/theme"
import { useDialog } from "../../providers/dialog"
import { useKeyboardLayer } from "../../providers/keyboard-layers"

type Props = {
  currentCwd?: string | null
  onConfirm: (path: string) => void
}

export function SetPathDialogContent({ currentCwd, onConfirm }: Props) {
  const { colors } = useTheme()
  const { close } = useDialog()
  const { isTopLayer } = useKeyboardLayer()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<InputRenderable>(null)
  const [path, setPath] = useState(currentCwd ?? "")

  useEffect(() => {
    if (inputRef.current && currentCwd) {
      inputRef.current.setText(currentCwd)
    }
  }, [])

  const handleConfirm = useCallback(() => {
    const trimmed = path.trim()
    if (!trimmed) {
      setError("Path cannot be empty")
      return
    }
    onConfirm(trimmed)
    close()
  }, [path, onConfirm, close])

  useKeyboard((key) => {
    if (!isTopLayer("dialog")) return
    if (key.name === "return") {
      key.preventDefault()
      handleConfirm()
    }
  })

  return (
    <box flexDirection="column" gap={1} width="100%">
      <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
        Enter the absolute path to your project folder
      </text>

      {currentCwd && (
        <box flexDirection="row" gap={1}>
          <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>Current:</text>
          <text fg={colors.info} attributes={TextAttributes.DIM}>{currentCwd}</text>
        </box>
      )}

      <box
        flexDirection="row"
        alignItems="center"
        gap={1}
        paddingX={1}
        backgroundColor={colors.surface}
      >
        <text fg={colors.primary}>📁</text>
        <input
          ref={inputRef}
          placeholder="e.g. /home/user/my-project"
          focused
          onContentChange={() => {
            setPath(inputRef.current?.plainText ?? "")
            setError(null)
          }}
        />
      </box>

      {error && (
        <box flexDirection="row" gap={1}>
          <text fg={colors.error}>✖</text>
          <text fg={colors.error}>{error}</text>
        </box>
      )}

      <box flexDirection="row" gap={2} marginTop={1}>
        <text fg={colors.primary} attributes={TextAttributes.DIM}>
          ⏎ confirm · esc cancel
        </text>
      </box>
    </box>
  )
}