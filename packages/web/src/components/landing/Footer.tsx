"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080810] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12">
          
          <div className="flex flex-col items-center md:items-start max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-white" />
              <span className="font-bold text-sm tracking-widest uppercase">Codak</span>
            </Link>
            <p className="text-zinc-400 text-sm text-center md:text-left">
              The AI coding assistant designed for local environments. Secure, fast, and terminal native.
            </p>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-white mb-2">Product</h4>
              <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors text-sm">Documentation</Link>
              <Link href="/#features" className="text-zinc-400 hover:text-white transition-colors text-sm">Features</Link>
              <Link href="/#pricing" className="text-zinc-400 hover:text-white transition-colors text-sm">Pricing</Link>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm">Download</a>
            </div>
            
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-white mb-2">Company</h4>
              <a href="https://github.com/codak-ai" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors text-sm">GitHub</a>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm">Twitter</a>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm">Discord</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} Codak AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
