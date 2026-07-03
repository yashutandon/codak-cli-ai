"use client";

import { motion } from "framer-motion";
import { Search, Eye, Shield, Zap } from "lucide-react";

const features = [
  {
    title: "Instant Project Context",
    description: "Codak automatically reads your local files. Just ask a question, and it knows exactly which files to edit—no manual context-feeding required.",
    icon: Search,
  },
  {
    title: "Visual Bug Fixing",
    description: "Got a UI glitch? Just paste the screenshot path into the terminal. Codak will look at the image and write the CSS/React code to fix it.",
    icon: Eye,
  },
  {
    title: "Learns Your Team's Style",
    description: "Drop a .codakrules file in your project. It instantly learns your specific coding standards (like 'always use Tailwind' or 'strict Zod validation').",
    icon: Zap,
  },
  {
    title: "100% Safe Execution",
    description: "We never run terminal commands blindly. You get a clear (Y/N) prompt before any file is saved or command is executed.",
    icon: Shield,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#080810] border-t border-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Code Faster, Not Harder</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Built from the ground up for developer experience. Say goodbye to tab-switching and hello to terminal-native flow state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="pro-card p-8 group"
            >
              <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-600 transition-colors">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
