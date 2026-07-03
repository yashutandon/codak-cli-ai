"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Terminal, BookOpen, Eye, Zap, FileText } from "lucide-react";

const sidebarLinks = [
  { name: "Introduction", href: "/docs", icon: BookOpen },
  { name: "Installation & Auth", href: "/docs/installation", icon: Terminal },
  { name: ".codakrules Configuration", href: "/docs/rules", icon: FileText },
  { name: "Multimodal Vision", href: "/docs/vision", icon: Eye },
  { name: "CLI Reference", href: "/docs/cli", icon: Zap },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[#080810] text-white selection:bg-zinc-800">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row container mx-auto px-4 py-8 gap-12 max-w-7xl">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <h3 className="font-semibold text-zinc-400 text-xs uppercase tracking-widest mb-4 px-2">Documentation</h3>
            <nav className="flex flex-col gap-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive 
                        ? "bg-zinc-900 text-white font-medium border border-zinc-800" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                    )}
                  >
                    <link.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-500")} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Content */}
        <main className="flex-1 min-w-0 max-w-4xl pb-24">
          <div className="prose prose-invert max-w-none">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
