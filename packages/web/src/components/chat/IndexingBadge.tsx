"use client";

import { useEffect, useState } from "react";
import type { IndexingStatus } from "@/types/api";
import { getIndexingStatus } from "@/lib/api";
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, LoaderIcon } from "lucide-react";

interface IndexingBadgeProps {
  sessionId: string;
}

export default function IndexingBadge({ sessionId }: IndexingBadgeProps) {
  const [status, setStatus] = useState<IndexingStatus | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const s = await getIndexingStatus(sessionId);
        if (cancelled) return;
        setStatus(s);

        // Keep polling while active
        if (s === "pending" || s === "indexing") {
          setTimeout(poll, 2500);
        }
      } catch {
        // Silently ignore — session might not have cwd
        if (!cancelled) setStatus(null);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!status || status === "pending") {
    if (!status) return null;
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-white/25 font-mono">
        <LoaderIcon size={10} className="animate-spin text-white/20" />
        Indexing queued
      </span>
    );
  }

  if (status === "indexing") {
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-mono">
        <DatabaseIcon size={10} className="animate-pulse" />
        Indexing codebase…
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-emerald-500/70 font-mono">
        <CheckCircleIcon size={10} />
        Codebase indexed
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-red-500/60 font-mono">
        <XCircleIcon size={10} />
        Indexing failed
      </span>
    );
  }

  return null;
}
