import { useState, useCallback, useRef } from "react"
import { useKeyboard } from "@opentui/react"
import type { InputRenderable, KeyBinding } from "@opentui/core"

import { StatusBar, type StatusBarProps } from "./status-bar"
import { EmptyBorder } from "../common/border"

export type InputBarProps = {
    onSubmit: (text: string) => void
    disabled?: boolean
    statusBar?: StatusBarProps
}

export function InputBar({
    onSubmit,
    disabled = false,
    statusBar = {},
}: InputBarProps) {
    const [value, setValue] = useState("")
    const [focused, setFocused] = useState(true)

    const inputRef = useRef<InputRenderable>(null)

    const stateRef = useRef({
        value,
        focused,
        disabled,
        onSubmit,
    })

    stateRef.current = {
        value,
        focused,
        disabled,
        onSubmit,
    }

    useKeyboard((key) => {
        const { disabled, focused } = stateRef.current

        if (disabled) return

        if (key.name === "escape") {
            inputRef.current?.clear?.()
            setValue("")
            setFocused(false)
            return
        }

        if (
            (key.name === "enter" || key.name === "return") &&
            !focused
        ) {
            setFocused(true)
        }
    })

    const clearInput = useCallback(() => {
        inputRef.current?.clear?.()
        setValue("")
    }, [])

    const handleInputSubmit = useCallback(() => {
        const { disabled, onSubmit } = stateRef.current

        if (disabled) return

        const text = inputRef.current?.plainText ?? ""

        if (!text.trim()) return

        onSubmit(text.trim())

        clearInput()
    }, [clearInput])

    const TEXTAREA_KEYBOARD_SHORTCUTS: KeyBinding[] = [
        {
            name: "return",
            action: "submit",
        },
        {
            name: "enter",
            action: "submit",
        },
        {
            name: "return",
            shift: true,
            action: "newline",
        },
        {
            name: "enter",
            shift: true,
            action: "newline",
        },
    ]

    const borderColor = disabled
        ? "#2A2A3A"
        : focused
          ? "#4A9EFF"
          : "#3A3A4A"

    const promptColor = disabled
        ? "#2A2A3A"
        : focused
          ? "#4A9EFF"
          : "#555577"

    const hintColor = disabled
        ? "#2A2A3A"
        : value.trim()
          ? "#4A9EFF"
          : "#333344"

    return (
        <box
            border={["left"]}
            customBorderChars={{
                ...EmptyBorder,
                vertical: "┃",
                bottomLeft: "┗",
            }}
            flexDirection="row"
            alignItems="center"
            width="100%"
            flexShrink={0}
            borderColor={borderColor}
            backgroundColor="#1A1A24"
            minHeight={5}
        >
            <StatusBar {...statusBar} />

            <box
                flexDirection="column"
                flexGrow={1}
                paddingLeft={1}
                paddingRight={1}
            >
                <box
                    flexDirection="row"
                    alignItems="center"
                    gap={1}
                    width="100%"
                >
                    <text fg={promptColor}>
                        {disabled ? "✖ " : "› "}
                    </text>

                    <textarea
                        ref={inputRef}
                        flexGrow={1}
                        flexShrink={1}
                        initialValue=""
                        keyBindings={TEXTAREA_KEYBOARD_SHORTCUTS}
                        placeholder={
                            disabled
                                ? "Disabled..."
                                : "Type a message..."
                        }
                        backgroundColor="transparent"
                        focusedBackgroundColor="transparent"
                        textColor={
                            disabled
                                ? "#444455"
                                : "#E0E0F0"
                        }
                        cursorColor="#4A9EFF"
                        focused={!disabled && focused}
                        onContentChange={() => {
                            setValue(
                                inputRef.current?.plainText ?? ""
                            )
                        }}
                        onSubmit={handleInputSubmit}
                    />

                    <text fg={hintColor}>
                        {disabled
                            ? ""
                            : value.trim().length > 0
                              ? " ↵"
                              : "esc to cancel"}
                    </text>
                </box>
            </box>
        </box>
    )
}