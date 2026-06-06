"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const sizes = {
  sm: 16,
  md: 24,
  lg: 36,
};

export function Spinner({ size = "md", message }: SpinnerProps) {
  const px = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin shrink-0"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
        />
        <path
          d="M12 3A9 9 0 0 1 21 12"
          stroke="rgba(99,102,241,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {message && (
        <span className="text-sm text-white/40 tracking-wide">{message}</span>
      )}
    </div>
  );
}

export function FullPageSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-[#080810] flex flex-col items-center justify-center gap-4 z-50">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <path
          d="M20 4A16 16 0 0 1 36 20"
          stroke="rgba(99,102,241,0.85)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-xs text-white/30 tracking-widest uppercase">{message}</p>
    </div>
  );
}