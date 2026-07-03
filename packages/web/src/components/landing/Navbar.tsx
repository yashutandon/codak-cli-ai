"use client";

import Link from "next/link";
import { Terminal, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
     
    setIsLoggedIn(!!localStorage.getItem("accessToken"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    window.location.reload();
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-[#080810] border-b border-zinc-900"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-white" />
          <span className="font-bold text-sm tracking-widest uppercase">Codak</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <a href="https://github.com/codak-ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </nav>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium text-zinc-400">
                Connected
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md transition-colors border border-zinc-800 flex items-center gap-2"
              >
                Sign Out <LogOut className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Log in
              </Link>
              <Link 
                href="/login" 
                className="text-sm font-medium bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
