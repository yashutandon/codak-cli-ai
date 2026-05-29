import type { RefObject } from "react"
import { COMMANDS } from "./commands"
import { filterCommands } from "./filter-commands"
import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core"



const MAX_VISIBLE_COMMANDS = 8;

const COMMAND_COL_WIDTH = Math.max(...COMMANDS.map(cmd => cmd.name.length)) + 4

type CommandMenuProps = {
    query: string
    selectedIndex: number
    containerRef: RefObject<ScrollBoxRenderable | null>
    onSelect: (command: string) => void
    onExecute: (command: string) => void
}

export const CommandMenu = ({ query, selectedIndex, containerRef, onSelect, onExecute }: CommandMenuProps) => {
    const filteredCommands = filterCommands(query);
    const visibleHeight = Math.min(filteredCommands.length, MAX_VISIBLE_COMMANDS);
    if (filteredCommands.length === 0) {
        return (
            <box padding={1} >
                <text attributes={TextAttributes.DIM}>No matches found</text>
            </box>
        )
    }

    return (
        <scrollbox
            ref={containerRef}
            height={visibleHeight}>
            {filteredCommands.map((cmd, index) => {
                const isSelected = index === selectedIndex
                return (
                    <box 
                     key={cmd.name}
                     flexDirection="row"
                     overflow="hidden"
                     paddingX={1}
                     height={1}
                     backgroundColor={isSelected ? "#007acc" : undefined}
                     onMouseMove={() => onSelect(cmd.value)}
                     onMouseDown={() => onExecute(cmd.value)}>
                        <box width={COMMAND_COL_WIDTH} flexShrink={0}   >

                        <text selectable={false} fg={isSelected ? "black" : "white"}>{cmd.value}</text>
                        </box>
                         <box flexGrow={1} flexShrink={1} overflow="hidden" >

                        <text selectable={false} fg={isSelected ? "black" : "gray"}>{cmd.description}</text>
                        </box>
                    </box>
                )
            })}
        </scrollbox>
    )

}