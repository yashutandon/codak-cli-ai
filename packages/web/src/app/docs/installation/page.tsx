export default function InstallationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 border-b border-zinc-800 pb-2">Installation & Auth</h1>
      
      <p className="text-zinc-400 leading-relaxed mb-6">
        Codak AI is distributed as a global npm package. It is designed to run in your terminal, directly within your local project directories.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">1. Install the CLI</h2>
      <p className="text-zinc-400 mb-4">You can install the CLI using npm, bun, or yarn:</p>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
        <code className="text-zinc-300 font-mono text-sm block mb-2 text-zinc-500"># Using npm</code>
        <code className="text-zinc-300 font-mono text-sm block mb-4">npm install -g codak-cli-ai</code>
        
        <code className="text-zinc-300 font-mono text-sm block mb-2 text-zinc-500"># Using bun</code>
        <code className="text-zinc-300 font-mono text-sm block">bun add -g codak-cli-ai</code>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">2. Authenticate</h2>
      <p className="text-zinc-400 mb-4">
        Before you can use Codak, you need to authenticate your terminal session. Run the following command anywhere in your terminal:
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
        <code className="text-zinc-300 font-mono text-sm">codak login</code>
      </div>

      <p className="text-zinc-400 leading-relaxed">
        This will open a browser window securely connecting to your Codak Web Dashboard. You can authenticate using GitHub, Google, or Magic Link. Once authenticated, your terminal will receive a secure token and you can close the browser.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">3. Start Coding</h2>
      <p className="text-zinc-400 mb-4">
        Navigate to any project directory and start asking Codak to do things:
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
        <code className="text-zinc-300 font-mono text-sm block mb-2">cd my-nextjs-project</code>
        <code className="text-zinc-300 font-mono text-sm block">codak "Add a dark mode toggle to the Navbar"</code>
      </div>

    </div>
  );
}
