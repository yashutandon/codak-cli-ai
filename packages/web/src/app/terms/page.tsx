"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080810] text-white selection:bg-zinc-800">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Terms of Service</h1>
        <p className="text-zinc-400 mb-8 text-sm">Last updated: July 2026</p>

        <div className="prose prose-invert max-w-none text-zinc-300">
          <h2 className="text-2xl font-bold text-white mb-4 mt-8">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By downloading, installing, or using the Codak AI CLI and Web Platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">2. Description of Service</h2>
          <p className="mb-4">
            Codak AI provides an autonomous coding agent operating within the user's local terminal. The service involves sending terminal inputs, file contents, and images (for vision features) to our backend APIs to generate code and command suggestions.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">3. User Responsibilities & Safety</h2>
          <p className="mb-4">
            You acknowledge that Codak AI generates code and terminal commands autonomously. While we implement safety confirmation prompts (Y/N), <strong>you are solely responsible for reviewing and approving all commands and code changes</strong> before they are executed on your local machine.
          </p>
          <p className="mb-4">
            We are not liable for any data loss, system corruption, or security vulnerabilities introduced by executing AI-generated commands or code.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">4. Data Privacy & Intellectual Property</h2>
          <p className="mb-4">
            We respect your intellectual property. The code in your local repositories remains yours. By using Codak AI, you grant us permission to temporarily process snippets of your code and images solely for the purpose of generating AI responses. We do not use your private code to train our foundational models.
          </p>
          <p className="mb-4">
            For more details, please review our <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">5. Subscriptions and Payments</h2>
          <p className="mb-4">
            Certain features of Codak AI require a paid subscription. Payments are processed securely via our payment partners (e.g., Razorpay). Subscriptions automatically renew unless canceled before the billing cycle ends. Refunds are evaluated on a case-by-case basis.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">6. Termination</h2>
          <p className="mb-4">
            We reserve the right to suspend or terminate your access to Codak AI if you violate these Terms, engage in abusive API usage, or attempt to reverse-engineer our platform.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
