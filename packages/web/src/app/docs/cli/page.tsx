export default function CliReferencePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 border-b border-zinc-800 pb-2">CLI Reference</h1>
      
      <p className="text-zinc-400 leading-relaxed mb-6">
        The Codak CLI is the primary way you interact with the agent. Below is a comprehensive list of available commands and flags.
      </p>

      <div className="space-y-8 mt-10">
        
        {/* codak chat */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 font-mono">codak &lt;prompt&gt;</h3>
          <p className="text-zinc-400 mb-4 text-sm">
            The default command. Starts a new chat session with Codak, providing the initial prompt. Codak will automatically analyze your current directory and respond.
          </p>
          <div className="bg-black border border-zinc-800 rounded p-3 mb-4">
            <code className="text-zinc-300 font-mono text-sm">codak "Create a new button component in src/components"</code>
          </div>
          <div className="bg-black border border-zinc-800 rounded p-3">
            <code className="text-zinc-300 font-mono text-sm">codak "Fix the typo in the README"</code>
          </div>
        </div>

        {/* codak login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 font-mono">codak login</h3>
          <p className="text-zinc-400 mb-4 text-sm">
            Authenticates your CLI session with the Codak Web Platform. This opens a secure browser window for OAuth or Email login.
          </p>
          <div className="bg-black border border-zinc-800 rounded p-3">
            <code className="text-zinc-300 font-mono text-sm">codak login</code>
          </div>
        </div>

        {/* codak logout */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 font-mono">codak logout</h3>
          <p className="text-zinc-400 mb-4 text-sm">
            Clears your local authentication tokens, ending the active session.
          </p>
          <div className="bg-black border border-zinc-800 rounded p-3">
            <code className="text-zinc-300 font-mono text-sm">codak logout</code>
          </div>
        </div>

        {/* codak whoami */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 font-mono">codak whoami</h3>
          <p className="text-zinc-400 mb-4 text-sm">
            Displays information about the currently authenticated user, including subscription tier and token usage status.
          </p>
          <div className="bg-black border border-zinc-800 rounded p-3">
            <code className="text-zinc-300 font-mono text-sm">codak whoami</code>
          </div>
        </div>

      </div>
    </div>
  );
}
