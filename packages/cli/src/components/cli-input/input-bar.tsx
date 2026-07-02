import { useState, useCallback, useRef, useEffect } from "react"
import { useKeyboard } from "@opentui/react"
import { TextAttributes, type InputRenderable, type KeyBinding } from "@opentui/core"
import { useNavigate } from "react-router"

import { StatusBar, type StatusBarProps } from "./status-bar"
import { EmptyBorder } from "../common/border"
import { CommandMenu } from "../command-menu"

import type { TextareaRenderable, ContentChangeEvent } from "@opentui/core"
import { useRenderer } from "@opentui/react"
import type { Command } from "../command-menu/types/command.types"
import { useCommandMenu } from "../command-menu/hooks/use-command-menu"
import { useToast } from "../../providers/toast"
import { useKeyboardLayer } from "../../providers/keyboard-layers"
import { useDialog } from "../../providers/dialog"
import { useTheme } from "../../providers/theme"
import { clearToken } from "../../auth"
import type { SupportedChatModelId } from "@codak/shared"

type Mode = "BUILD" | "PLAN"
export type InputBarProps = {
    onSubmit: (text: string) => void
    disabled?: boolean
    statusBar?: StatusBarProps
    onModeChange?: () => void
    setMode?: (mode: Mode) => void
    setModel?: (modelId: SupportedChatModelId) => void
    currentModel?: SupportedChatModelId
    sessionId?: string
    sessionCwd?: string | null
}


export function InputBar({
    onSubmit,
    disabled = false,
    statusBar = {},
    onModeChange,
    setMode,
    setModel,
    currentModel,
    sessionId,
    sessionCwd,
}: InputBarProps) {
    const [value, setValue] = useState("")
    const [focused, setFocused] = useState(true)

    const inputRef = useRef<InputRenderable>(null)
    const textareaRef = useRef<TextareaRenderable>(null)
    const onSubmitRef = useRef<() => void>(() => { })
    const renderer = useRenderer()
    const navigate = useNavigate()

    const {
        showCommandMenu,
        commandQuery,
        scrollRef,
        selectedIndex,
        handleContentChange,
        resolveCommand,
        closeMenu,
        setSelectedIndex,
    } = useCommandMenu()

    const toast = useToast()
    const { isTopLayer, setResponder } = useKeyboardLayer()
    const dialog = useDialog()
    const { colors } = useTheme()

const handleCommand = useCallback((command: Command | undefined) => {
    const textarea = textareaRef.current
    if (!command || !textarea) return
    textarea.setText("")
    if (command.action) {
        command.action({
            exit: () => renderer.destroy(),
            toast,
            dialog,
            navigate,
            clearToken,
            sessionId,
            sessionCwd,
            setMode,
            currentModel,
            setModel,
        })
    } else {
        textarea.insertText(command.value + "")
    }
}, [renderer, toast, dialog, navigate, sessionId, sessionCwd, setMode, currentModel, setModel]) 

    const handleSelectByCommand = useCallback((_command: string) => { }, [])

    const handleCommandExecute = useCallback((_command: string) => {
        const resolved = resolveCommand(selectedIndex)
        if (resolved) {
            closeMenu()
            handleCommand(resolved)
        }
    }, [selectedIndex, resolveCommand, closeMenu, handleCommand])

    const handleTextAreaChange = useCallback((_event: ContentChangeEvent) => {
        const textarea = textareaRef.current
        if (!textarea) return
        setValue(textarea.plainText)
        handleContentChange(textarea.plainText)
    }, [handleContentChange])

    const handleSubmit = useCallback(() => {
        if (disabled) return
        const textarea = textareaRef.current
        if (!textarea) return
        const text = textarea.plainText.trim()
        if (text.length === 0) return
        onSubmit(text)
        textarea.setText("")
    }, [disabled, onSubmit])

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.onSubmit = () => {
            onSubmitRef.current()
        }
    }, [])

    onSubmitRef.current = () => {
        if (disabled) return
        if (showCommandMenu) {
            const command = resolveCommand(selectedIndex)
            if (command) {
                closeMenu()
                handleCommand(command)
            }
            return
        }
        handleSubmit()
    }

    const stateRef = useRef({ value, focused, disabled, onSubmit })
    stateRef.current = { value, focused, disabled, onSubmit }

    useKeyboard((key) => {
        const { disabled, focused } = stateRef.current
        if (disabled) return
        if (key.name === "tab") {
            onModeChange?.()
            return
        }
        if (key.name === "escape") {
            inputRef.current?.clear?.()
            setValue("")
            setFocused(false)
            return
        }
        if ((key.name === "enter" || key.name === "return") && !focused) {
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
        { name: "return", action: "submit" },
        { name: "enter", action: "submit" },
        { name: "return", shift: true, action: "newline" },
        { name: "enter", shift: true, action: "newline" },
    ]

    const borderColor = disabled
        ? colors.dimSeparator
        : focused
            ? colors.primary
            : colors.selection

    const promptColor = disabled
        ? colors.dimSeparator
        : focused
            ? colors.primary
            : colors.dimSeparator

    const hintColor = disabled
        ? colors.dimSeparator
        : value.trim()
            ? colors.primary
            : colors.selection

    const textColor = disabled
        ? colors.dimSeparator
        : colors.thinking

    useEffect(() => {
        setResponder("base", () => {
            if (disabled) return false
            const textarea = textareaRef.current
            if (textarea && textarea.plainText.length > 0) {
                textarea.setText("")
                return true
            }
            return false
        })
        return () => setResponder("base", null)
    }, [disabled, setResponder])

    return (
        <box
            border={["left"]}
            customBorderChars={{
                ...EmptyBorder,
                vertical: "│",
                bottomLeft: "╰",
            }}
            flexDirection="row"
            alignItems="center"
            width="100%"
            flexShrink={0}
            borderColor={borderColor}
            backgroundColor={colors.surface}
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
                        {disabled ? "✖ " : "❯ "}
                    </text>

                    {showCommandMenu && (
                        <box
                            position="absolute"
                            left={0}
                            bottom="100%"
                            width="100%"
                            backgroundColor={colors.surface}
                            zIndex={10}
                        >
                            <CommandMenu
                                query={commandQuery}
                                selectedIndex={selectedIndex}
                                containerRef={scrollRef}
                                onSelect={handleSelectByCommand}
                                onExecute={handleCommandExecute}
                            />
                        </box>
                    )}

                    <textarea
                        ref={textareaRef}
                        flexGrow={1}
                        flexShrink={1}
                        initialValue={value}
                        keyBindings={TEXTAREA_KEYBOARD_SHORTCUTS}
                        placeholder={
                            disabled
                                ? "Disabled..."
                                : "Type a message, @ for commands..."
                        }
                        backgroundColor="transparent"
                        focusedBackgroundColor="transparent"
                        textColor={textColor}
                        cursorColor={colors.primary}
                        focused={
                            !disabled &&
                            focused &&
                            (isTopLayer("base") || isTopLayer("command"))
                        }
                        onContentChange={handleTextAreaChange}
                        onSubmit={handleInputSubmit}
                    />

                    <text fg={hintColor} attributes={TextAttributes.DIM}>
                        {disabled
                            ? ""
                            : value.trim().length > 0
                                ? "⏎ send"
                                : "esc cancel"}
                    </text>
                </box>
            </box>
        </box>
    )
}