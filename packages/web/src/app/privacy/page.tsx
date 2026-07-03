"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080810] text-white selection:bg-zinc-800">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-zinc-400 mb-8 text-sm">Last updated: July 2026</p>

        <div className="prose prose-invert max-w-none text-zinc-300">
          <h2 className="text-2xl font-bold text-white mb-4 mt-8">1. Introduction</h2>
          <p className="mb-4">
            At Codak AI, we take your privacy and the security of your codebase very seriously. This Privacy Policy outlines how we collect, use, and protect your information when you use our CLI and Web Platform.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">2. Data We Collect</h2>
          <p className="mb-4">
            <strong>Account Information:</strong> When you authenticate via OAuth or email, we collect basic profile data (email address, name) to manage your subscription and API access.
          </p>
          <p className="mb-4">
            <strong>Usage Data (Telemetry):</strong> We track token usage, CLI command frequencies, and error rates to bill you accurately and improve platform stability.
          </p>
          <p className="mb-4">
            <strong>Code and File Contents:</strong> When you execute a prompt in the Codak CLI, the CLI reads local files to provide context to the AI. These file contents are sent securely over HTTPS to our backend APIs.
          </p>
          <p className="mb-4">
            <strong>Images:</strong> When using the Multimodal Vision feature, images are processed and sent to our vision models.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">3. How We Use Your Data</h2>
          <p className="mb-4">
            <strong>No Training on Private Code:</strong> We <strong>DO NOT</strong> use your proprietary codebase, files, or images to train our foundational models. The data transmitted during a CLI session is strictly used in real-time to generate your specific response.
          </p>
          <p className="mb-4">
            <strong>Ephemeral Processing:</strong> Code snippets and images sent to our APIs are processed ephemerally and are not permanently stored in our databases unless explicitly saved via opt-in chat history features.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">4. Data Security</h2>
          <p className="mb-4">
            All data transmitted between the Codak CLI and our servers is encrypted in transit using TLS 1.3. We employ industry-standard security measures to protect your account data and API keys.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">5. Third-Party Subprocessors</h2>
          <p className="mb-4">
            To provide the AI capabilities, we may route your prompts through trusted third-party LLM providers (e.g., OpenAI, Anthropic, Google). We only partner with providers that guarantee zero-data-retention and zero-training policies for API consumers.
          </p>

          <h2 className="text-2xl font-bold text-white mb-4 mt-8">6. Contact Us</h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy or how your data is handled, please reach out to us at privacy@codak-ai.com.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
