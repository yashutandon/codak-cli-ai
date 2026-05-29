export type ToastVarient= "success" | "error" | "info" | "warning"

export type ToastOptions = {
    message: string
    variant?: ToastVarient
    duration?: number
};

export const DEFAULT_TOAST_DURATION = 3000;