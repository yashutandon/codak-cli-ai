"use client";

import { motion } from "framer-motion";
import { Terminal, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Particles } from "./Particles";

export function Hero() {
  const [copied, setCopied] = useState(false);
  const installCmd = "npm i -g codak-cli-ai";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#080810] min-h-[80vh] flex items-center">
      <Particles className="z-0" />
      
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-zinc-800 bg-zinc-900/50 text-zinc-300 mb-8 text-xs font-semibold tracking-widest uppercase"
        >
          <Terminal className="w-3 h-3" />
          <span>v1.0 is now live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
        >
          The <span className="text-white border-b-2 border-zinc-500">Rules-First</span> <br />
          <span className="text-zinc-500">Autonomous Coding Agent</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-zinc-400 max-w-2xl mb-12"
        >
          Stop fighting generic AI outputs. Codak injects your team's architecture rules directly into the context window, sees UI bugs via screenshots, and executes commands safely inside your terminal.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="bg-zinc-900 px-6 py-4 rounded-md flex items-center gap-4 border border-zinc-800">
            <span className="text-zinc-600 select-none">$</span>
            <code className="text-zinc-300 font-mono text-sm">{installCmd}</code>
            <button 
              onClick={copyToClipboard}
              className="ml-4 text-zinc-500 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
