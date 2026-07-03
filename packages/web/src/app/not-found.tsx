"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";
import { Particles } from "@/components/landing/Particles";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden selection:bg-zinc-800">
      <Particles className="z-0 opacity-50" />
      
      <div className="z-10 flex flex-col items-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl">
          <Terminal className="w-8 h-8 text-zinc-400" />
        </div>
        
        <h1 className="text-7xl font-black text-white tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-300 tracking-tight mb-6">Page not found</h2>
        
        <p className="text-zinc-500 max-w-md mb-10 text-sm">
          The page you are looking for doesn't exist or has been moved. 
          Check the URL or head back to the terminal.
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2.5 rounded-md text-sm font-medium text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            Go Back
          </button>
          <Link 
            href="/"
            className="px-6 py-2.5 rounded-md text-sm font-medium text-black bg-white hover:bg-zinc-200 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
      
      {/* Background subtle glow to match aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-zinc-900/20 blur-[150px] rounded-full pointer-events-none z-0" />
    </main>
  );
}
