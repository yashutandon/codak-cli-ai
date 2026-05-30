import { ThemeDialogContent } from "../theme/theme-dialog";
import type { Command } from "./types/command.types";

export const COMMANDS: Command[] = [
    // Conversation Commands
    {
        name: "New Conversation",
        description: "Start a new conversation",
        value: "@new",
        action: (ctx) => {
            // ctx.toast.show({
            //     message: "New conversation started!",
            //     variant: "success",
            // });

            ctx.dialog.open({
                title:"Open new chat",
                children:<text>New chat option coming soon</text>
            })
        }
    },
    {
        name: "Open Conversation",
        description: "Open an existing conversation",
        value: "@open",
        action: (ctx) => {
            ctx.toast.show({
                message: "Conversation opened!",
                variant: "info",
            });
        }
    },
    {
        name: "Save Conversation",
        description: "Save the current conversation",
        value: "@save",
        action: (ctx) => {
            ctx.toast.show({
                message: "Conversation saved!",
                variant: "success",
            });
        }
    },
    {
        name: "Close Conversation",
        description: "Close the current conversation",
        value: "@close",
        action: (ctx) => {
            ctx.toast.show({
                message: "Conversation closed!",
                variant: "warning",
            });
        }
    },

    // Authentication
    {
        name: "Login",
        description: "Sign in to your account",
        value: "@login",
        action: (ctx) => {
            ctx.toast.show({
                message: "Logged in!",
                variant: "success",
            });
        }
    },
    {
        name: "Logout",
        description: "Sign out of your account",
        value: "@logout",
        action: (ctx) => {
            ctx.toast.show({
                message: "Logged out!",
                variant: "info",
            });
        }
    },
    {
        name: "Register",
        description: "Create a new account",
        value: "@register",
        action: (ctx) => {
            ctx.toast.show({
                message: "Account created!",
                variant: "success",
            });
        }
    },
    {
        name: "Profile",
        description: "View your profile",
        value: "@profile",
        action: (ctx) => {
            ctx.toast.show({
                message: "Profile opened!",
                variant: "info",
            });
        }
    },

    // Theme Commands
  
    {
        name: "Theme",
        description: "Change colpr theme",
        value: "@theme",
        action: (ctx) => {
           ctx.dialog.open({
            title:"Select Theme",
            children:<ThemeDialogContent/>
           })
        }
    },

    // Application
    {
        name: "Settings",
        description: "Open application settings",
        value: "@settings",
        action: (ctx) => {
            ctx.toast.show({
                message: "Settings opened!",
                variant: "info",
            });
        }
    },
    {
        name: "Help",
        description: "Show available commands",
        value: "@help",
        action: (ctx) => {
            ctx.toast.show({
                message: "Help opened!",
                variant: "info",
            });
        }
    },
    {
        name: "Clear Chat",
        description: "Clear current conversation",
        value: "@clear",
        action: (ctx) => {
            ctx.toast.show({
                message: "Chat cleared!",
                variant: "warning",
            });
        }
    },
    {
        name: "Export Chat",
        description: "Export conversation history",
        value: "@export",
        action: (ctx) => {
            ctx.toast.show({
                message: "Chat exported!",
                variant: "success",
            });
        }
    },

    // Exit
    {
    name: "Exit",
    description: "Exit the application",
    value: "@exit",
    action: (ctx) => {
        ctx.toast.show({
            message: "Exiting application!",
            variant: "info",
        });
        ctx.exit();
    },
},
];