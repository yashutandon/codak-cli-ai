import { COMMANDS } from "./commands"
import type { Command } from "./types/command.types"

export const filterCommands = (query: string):Command[] => {
    if(query.length === 0) return COMMANDS
    return COMMANDS.filter((cmd) => {
        return (
            cmd.name.toLowerCase().includes(query.toLowerCase()) ||
            cmd.description.toLowerCase().includes(query.toLowerCase())
        )
    })
}