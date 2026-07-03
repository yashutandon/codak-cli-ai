export default function DocsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Codak AI Documentation</h1>
      <p className="text-zinc-400 text-lg leading-relaxed">
        Welcome to the official documentation for Codak AI. Codak is a rules-first autonomous coding agent designed to live in your local terminal and integrate seamlessly with your existing development workflow.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-semibold mb-3">Why Codak?</h3>
        <p className="text-zinc-400 mb-4 leading-relaxed">
          Traditional AI coding assistants (like Copilot or ChatGPT) generate generic code that often violates your project's specific architecture or styling rules. You spend more time correcting the AI than writing the code.
        </p>
        <p className="text-zinc-400 leading-relaxed">
          Codak solves this by being <strong>Rules-First</strong>. It ingests a <code className="text-white bg-black px-1.5 py-0.5 rounded text-sm">.codakrules</code> file from your repository and strictly enforces those constraints on every autonomous action it takes.
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-2">Core Capabilities</h2>
      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-xs">1</div>
          <div>
            <strong className="block text-white mb-1">Local File Context</strong>
            <span className="text-zinc-400 text-sm">Codak automatically reads your local files. Just ask a question, and it knows exactly which files to edit without manual context-feeding.</span>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-xs">2</div>
          <div>
            <strong className="block text-white mb-1">Multimodal Vision</strong>
            <span className="text-zinc-400 text-sm">Provide paths to UI screenshots and Codak will write the necessary CSS/React code to fix UI bugs instantly.</span>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-xs">3</div>
          <div>
            <strong className="block text-white mb-1">Safe Execution</strong>
            <span className="text-zinc-400 text-sm">Codak will propose terminal commands and file edits, but will never execute them without your explicit (Y/N) confirmation.</span>
          </div>
        </li>
      </ul>
    </div>
  );
}
