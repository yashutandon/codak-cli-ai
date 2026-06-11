import { createContext, useContext, useState, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import type { ToastOptions, ToastVariant } from "./types/types"
import { DEFAULT_TOAST_DURATION } from "./types/types"
import { useTerminalDimensions } from "@opentui/react"
import { SplitBorder } from "../../components/common/border"
import { useTheme } from "../theme"

export type ToastContextValue = {
    show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const value = useContext(ToastContext)
    if (!value) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return value
}

type ToastProviderProps = {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const clearCurrentTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const show = useCallback(
        (options: ToastOptions) => {
            const duration = options.duration ?? DEFAULT_TOAST_DURATION

            clearCurrentTimeout()
            setCurrentToast({
                variant: options.variant ?? "info",
                ...options,
                duration,
            })
            timeoutRef.current = setTimeout(() => {
                setCurrentToast(null)
                timeoutRef.current = null
            }, duration).unref()
        },
        [clearCurrentTimeout],
    )

    const value: ToastContextValue = { show }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast currentToast={currentToast} />
        </ToastContext.Provider>
    )
}

type ToastProps = {
    currentToast: ToastOptions | null
}

function Toast({ currentToast }: ToastProps) {
    const { width } = useTerminalDimensions()
    const { colors } = useTheme()

    if (!currentToast) return null

    const variantColors: Record<ToastVariant, string> = {
        success: colors.success,
        error: colors.error,
        info: colors.info,
        warning: colors.planMode,
    }

    const borderColor = currentToast.variant
        ? variantColors[currentToast.variant]
        : variantColors.info

    return (
        <box
            position="absolute"
            justifyContent="flex-start"
            alignItems="flex-start"
            width={Math.max(1, Math.min(60, width - 6))}
            top={2}
            left={2}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
            backgroundColor={colors.dialogSurface}
            borderColor={borderColor}
            border={["left", "right"]}
            customBorderChars={SplitBorder}
        >
            <box flexDirection="column" gap={1} width="100%">
                <text fg={colors.thinking} wrapMode="word" width="100%">
                    {currentToast.message}
                </text>
            </box>
        </box>
    )
}
