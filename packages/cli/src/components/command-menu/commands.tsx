import type { Command } from "./types/command.types";

export const COMMANDS: Command[] = [
    // Conversation Commands
    {
        name: "New Conversation",
        description: "Start a new conversation",
        value: "@new",
    },
    {
        name: "Open Conversation",
        description: "Open an existing conversation",
        value: "@open",
    },
    {
        name: "Save Conversation",
        description: "Save the current conversation",
        value: "@save",
    },
    {
        name: "Close Conversation",
        description: "Close the current conversation",
        value: "@close",
    },

    // Authentication
    {
        name: "Login",
        description: "Sign in to your account",
        value: "@login",
    },
    {
        name: "Logout",
        description: "Sign out of your account",
        value: "@logout",
    },
    {
        name: "Register",
        description: "Create a new account",
        value: "@register",
    },
    {
        name: "Profile",
        description: "View your profile",
        value: "@profile",
    },

    // Theme Commands
    {
        name: "Dark Theme",
        description: "Switch to dark mode",
        value: "@theme-dark",
    },
    {
        name: "Light Theme",
        description: "Switch to light mode",
        value: "@theme-light",
    },
    {
        name: "System Theme",
        description: "Use system theme",
        value: "@theme-system",
    },

    // Application
    {
        name: "Settings",
        description: "Open application settings",
        value: "@settings",
    },
    {
        name: "Help",
        description: "Show available commands",
        value: "@help",
    },
    {
        name: "Clear Chat",
        description: "Clear current conversation",
        value: "@clear",
    },
    {
        name: "Export Chat",
        description: "Export conversation history",
        value: "@export",
    },

    // Exit
    {
        name: "Exit",
        description: "Exit the application",
        value: "@exit",
        action: (ctx) => {
            ctx.exit();
        },
    },
];