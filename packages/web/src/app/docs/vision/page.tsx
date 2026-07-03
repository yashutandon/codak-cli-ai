export default function VisionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 border-b border-zinc-800 pb-2">Multimodal Vision</h1>
      
      <p className="text-zinc-400 leading-relaxed mb-6">
        Codak AI natively supports Multimodal Vision. This means you can pass images directly to the CLI, and Codak will parse them, understand the visual context, and execute code changes based on what it sees.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-4">Fixing UI Bugs</h2>
      <p className="text-zinc-400 mb-4">
        The most common use-case for Multimodal Vision is fixing UI glitches without having to describe them in text. If a button is misaligned, just take a screenshot and pass the file path to Codak.
      </p>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
        <code className="text-zinc-300 font-mono text-sm leading-relaxed block">
          $ codak "Look at this screenshot. The login button is misaligned and the padding is weird. Fix the CSS." ./screenshots/bug1.png
        </code>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Implementing Designs</h2>
      <p className="text-zinc-400 mb-4">
        You can also pass a Figma mockup or a design reference and ask Codak to implement it.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
        <code className="text-zinc-300 font-mono text-sm leading-relaxed block">
          $ codak "Create a new React component that looks exactly like this mockup." ./designs/pricing-page.webp
        </code>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Supported Formats</h2>
      <ul className="list-disc list-inside text-zinc-400 space-y-2 mb-8">
        <li><code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-sm">.png</code></li>
        <li><code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-sm">.jpg</code> / <code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-sm">.jpeg</code></li>
        <li><code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-sm">.webp</code></li>
      </ul>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">How it works behind the scenes</h4>
        <p className="text-zinc-400 text-sm leading-relaxed">
          When you provide an image path, the Codak CLI automatically reads the local file, converts it into an optimized base64 format, and streams it to our Vision API alongside your text prompt. No images are permanently stored on our servers.
        </p>
      </div>
    </div>
  );
}
