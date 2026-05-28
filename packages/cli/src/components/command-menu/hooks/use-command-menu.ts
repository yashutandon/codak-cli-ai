import { useRef, useState, useMemo, type RefObject } from "react"
import { filterCommands } from "../../command-menu/filter-commands"
import type { ScrollBoxRenderable } from "@opentui/core"
import type { Command } from "../../command-menu/types/command.types"
import { useKeyboard } from "@opentui/react"

type UseCommandMenuReturn = {
    showCommandMenu: boolean
    commandQuery: string
    scrollRef: RefObject<ScrollBoxRenderable | null>
    selectedIndex: number
    filteredCommands: Command[]
    handleContentChange: (text: string) => void
    resolveCommand: (index: number) => Command | null
    closeMenu: () => void
    setSelectedIndex: (index: number) => void
}

export const useCommandMenu = (): UseCommandMenuReturn => {

    const [showCommandMenu, setShowCommandMenu] = useState(false)
    const [textValue, setTextValue] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollRef = useRef<ScrollBoxRenderable | null>(null)

    const commandQuery = showCommandMenu && textValue.startsWith("@") ? textValue.slice(1) : ""

    const filteredCommands = useMemo(() => {
        return filterCommands(commandQuery)
    }, [commandQuery])

    // Keep a ref so keyboard handler always sees latest filteredCommands
    // without needing to be re-registered on every render
    const filteredCommandsRef = useRef(filteredCommands)
    filteredCommandsRef.current = filteredCommands

    const handleContentChange = (text: string) => {
        setTextValue(text)
        setSelectedIndex(0)
        const scrollbox = scrollRef.current
        if (scrollbox) {
            scrollbox.scrollTo(0)
        }
        const prefix = text.startsWith("@") ? text.slice(1) : null
        if (prefix != null && !prefix.includes(" ")) {
            setShowCommandMenu(true)
        } else {
            setShowCommandMenu(false)
        }
    }

    const closeMenu = () => {
        setShowCommandMenu(false)
        setSelectedIndex(0)
    }

    // FIX: resolveCommand no longer calls setShowCommandMenu itself.
    // Closing the menu is the caller's responsibility (via closeMenu),
    // so there's no async state race between resolving and acting on the command.
    const resolveCommand = (index: number): Command | null => {
        return filteredCommandsRef.current[index] ?? null
    }

    useKeyboard((key) => {
        if (!showCommandMenu) return

        if (key.name === "escape") {
            key.preventDefault()
            closeMenu()
            return
        }

        if (key.name === "arrowdown" || key.name === "down") {
            key.preventDefault()
            setSelectedIndex((i) => {
                const cmds = filteredCommandsRef.current
                if (cmds.length === 0) return 0
                const newIndex = Math.min(cmds.length - 1, i + 1)
                const sb = scrollRef.current
                if (sb) {
                    const viewportHeight = sb.viewport.height
                    const visibleEnd = sb.scrollTop + viewportHeight - 1
                    if (newIndex > visibleEnd) {
                        sb.scrollTo(newIndex - viewportHeight + 1)
                    }
                }
                return newIndex
            })
        }

        if (key.name === "arrowup" || key.name === "up") {
            key.preventDefault()
            setSelectedIndex((i) => {
                const newIndex = Math.max(0, i - 1)
                const sb = scrollRef.current
                if (sb && newIndex < sb.scrollTop) {
                    sb.scrollTo(newIndex)
                }
                return newIndex
            })
        }
    })

    return {
        showCommandMenu,
        commandQuery,
        scrollRef,
        selectedIndex,
        filteredCommands,
        handleContentChange,
        resolveCommand,
        closeMenu,
        setSelectedIndex,
    }
}