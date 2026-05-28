import { useState, useCallback, useRef, useEffect } from "react"
import { useKeyboard } from "@opentui/react"
import type { InputRenderable, KeyBinding } from "@opentui/core"

import { StatusBar, type StatusBarProps } from "./status-bar"
import { EmptyBorder } from "../common/border"
import { CommandMenu } from "../command-menu"

import type { TextareaRenderable, ContentChangeEvent } from "@opentui/core"
import { useRenderer } from "@opentui/react"
import type { Command } from "../command-menu/types/command.types"
import { useCommandMenu } from "../command-menu/hooks/use-command-menu"

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
    const textareaRef = useRef<TextareaRenderable>(null)
    const onSubmitRef = useRef<() => void>(() => { })
    const renderer = useRenderer()
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

    // FIX: handleCommand is defined BEFORE anything that calls it.
    // Previously it was defined after handleCommandExecute, so
    // handleCommandExecute captured it as undefined in its closure.
    const handleCommand = useCallback((command: Command | undefined) => {
        const textarea = textareaRef.current
        if (!command || !textarea) return
        textarea.setText("")
        if (command.action) {
            command.action({
                exit: () => {
                    renderer.destroy()
                }
            })
        } else {
            textarea.insertText(command.value + "")
        }
    }, [renderer])

    const handleSelectByCommand = useCallback((_command: string) => {
        // selectedIndex is managed by useCommandMenu
    }, [])

    // FIX: handleCommandExecute now has handleCommand in its deps,
    // and calls closeMenu() explicitly so the menu hides immediately
    // without a race between resolveCommand's setState and this handler.
    const handleCommandExecute = useCallback((_command: string) => {
        const resolved = resolveCommand(selectedIndex)
        if (resolved) {
            closeMenu()
            handleCommand(resolved)
        }
    }, [selectedIndex, resolveCommand, closeMenu, handleCommand])

    const handleTextAreaChange = useCallback((event: ContentChangeEvent) => {
        const textarea = textareaRef.current
        if (!textarea) return
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

    // FIX: onSubmitRef pattern already avoids stale closures here — good.
    // Also calls closeMenu() explicitly before handleCommand, same fix as above.
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
        { name: "return", action: "submit" },
        { name: "enter", action: "submit" },
        { name: "return", shift: true, action: "newline" },
        { name: "enter", shift: true, action: "newline" },
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
                    {showCommandMenu && (
                        <box
                            position="absolute"
                            left={0}
                            bottom="100%"
                            width="100%"
                            backgroundColor="#4A9EFF22"
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
                        onContentChange={handleTextAreaChange}
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