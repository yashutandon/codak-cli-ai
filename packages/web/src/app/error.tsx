"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Particles } from "@/components/landing/Particles";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden selection:bg-zinc-800">
      <Particles className="z-0 opacity-30" />
      
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-2xl">
          <AlertOctagon className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Something went wrong</h1>
        
        <p className="text-zinc-400 mb-8 text-sm">
          A critical error occurred while rendering this page. The engineering team has been notified.
        </p>

        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-4 mb-8 text-left overflow-hidden">
          <p className="text-xs font-mono text-red-400 truncate">
            {error.message || "Unknown Application Error"}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium text-black bg-white hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <Link 
            href="/"
            className="px-6 py-2.5 rounded-md text-sm font-medium text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
    </main>
  );
}
