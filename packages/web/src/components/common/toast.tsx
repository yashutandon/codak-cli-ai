"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

type ToastVariant = "error" | "success" | "loading";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (opts: { message: string; variant: ToastVariant }) => string;
  dismiss: (id: string) => void;
  loading: (message: string) => string;
  success: (message: string, id?: string) => void;
  error: (message: string, id?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({
      message,
      variant,
      duration = 4000,
      id: existingId,
    }: {
      message: string;
      variant: ToastVariant;
      duration?: number;
      id?: string;
    }) => {
      const id = existingId ?? crypto.randomUUID();

      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered, { id, message, variant }];
      });

      if (variant !== "loading") {
        const timer = timers.current.get(id);
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, newTimer);
      }

      return id;
    },
    [dismiss]
  );

  const loading = useCallback(
    (message: string) => show({ message, variant: "loading" }),
    [show]
  );

  const success = useCallback(
    (message: string, id?: string) =>
      show({ message, variant: "success", id }),
    [show]
  );

  const error = useCallback(
    (message: string, id?: string) =>
      show({ message, variant: "error", id }),
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss, loading, success, error }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2.5 items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const icons = {
    error: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="7.5" cy="10" r="0.75" fill="currentColor" />
      </svg>
    ),
    success: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.5 7.5L6.5 9.5L10.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    loading: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="animate-spin">
        <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.25" />
        <path d="M7.5 1.5A6 6 0 0 1 13.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  };

  const styles = {
    error: {
      bg: "rgba(18,6,6,0.92)",
      border: "rgba(226,75,74,0.25)",
      icon: "#E24B4A",
      text: "rgba(255,255,255,0.88)",
    },
    success: {
      bg: "rgba(4,18,8,0.92)",
      border: "rgba(99,153,34,0.25)",
      icon: "#97C459",
      text: "rgba(255,255,255,0.88)",
    },
    loading: {
      bg: "rgba(8,8,16,0.92)",
      border: "rgba(255,255,255,0.1)",
      icon: "rgba(255,255,255,0.5)",
      text: "rgba(255,255,255,0.75)",
    },
  };

  const s = styles[toast.variant];

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm max-w-xs w-full"
      style={{
        background: s.bg,
        border: `0.5px solid ${s.border}`,
        backdropFilter: "blur(12px)",
        animation: "slideIn 0.18s ease-out",
      }}
    >
      <span style={{ color: s.icon, flexShrink: 0 }}>
        {icons[toast.variant]}
      </span>
      <span
        className="flex-1 leading-snug"
        style={{ color: s.text, fontSize: "13px" }}
      >
        {toast.message}
      </span>
      {toast.variant !== "loading" && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: s.text }}
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}