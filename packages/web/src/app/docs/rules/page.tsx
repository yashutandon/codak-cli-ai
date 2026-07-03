export default function RulesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 border-b border-zinc-800 pb-2">.codakrules Configuration</h1>
      
      <p className="text-zinc-400 leading-relaxed mb-6">
        Codak is built around the philosophy that AI should adapt to your team, not the other way around. 
        By placing a <code className="text-white bg-zinc-800 px-1.5 py-0.5 rounded text-sm">.codakrules</code> file in the root of your project, you ensure that every AI generation strictly follows your architecture, linting, and stylistic guidelines.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">How it works</h2>
      <p className="text-zinc-400 mb-4">
        When you run a command via the Codak CLI, it recursively searches upwards from your current directory for a <code className="text-white">.codakrules</code> file (similar to how <code className="text-white">.gitignore</code> works). If found, the contents of this file are prepended to the system prompt as immutable constraints.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">Example Configuration</h2>
      <p className="text-zinc-400 mb-4">
        A <code className="text-white">.codakrules</code> file is typically a simple Markdown list of rules. Here is an example for a Next.js/React project:
      </p>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <pre className="text-zinc-300 font-mono text-sm leading-relaxed">
{`# Codak Architecture Rules

## Styling
- ALWAYS use Tailwind CSS utility classes.
- NEVER create custom .css files or CSS modules unless absolutely necessary.
- Use the 'lucide-react' library for icons.

## React & Next.js
- Default to React Server Components (RSC).
- Only use "use client" when state, lifecycle hooks, or browser APIs are required.
- Do not use the legacy /pages router, always use the /app router.

## Data Fetching & Validation
- Validate all API inputs and outputs using Zod.
- Use Prisma for database access. Do not write raw SQL.`}
        </pre>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
          💡 Pro Tip
        </h4>
        <p className="text-blue-300/80 text-sm leading-relaxed">
          Keep your rules concise and imperative. Use words like "ALWAYS" and "NEVER" to give the AI strict boundaries. If you find the AI making the same mistake repeatedly, add a rule for it!
        </p>
      </div>
    </div>
  );
}
