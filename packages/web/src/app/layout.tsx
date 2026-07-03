import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/common/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codak AI | The Rules-First Autonomous Coding Agent",
  description: "An enterprise-grade, terminal-native AI agent that strictly follows your team's architectural rules, features multimodal vision for UI fixes, and guarantees safe command execution.",
  keywords: ["AI coding agent", "CLI", "Developer Tools", "Hybrid RAG", "Code Generation", "Autonomous Agent"],
  authors: [{ name: "Codak Team" }],
  openGraph: {
    title: "Codak AI | The Rules-First Autonomous Coding Agent",
    description: "The AI agent that actually respects your codebase architecture. Features rule-injection, vision support, and strict command firewalls.",
    url: "https://codak.ai",
    siteName: "Codak AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Codak AI | The Rules-First Autonomous Coding Agent",
    description: "The AI agent that actually respects your codebase architecture.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
