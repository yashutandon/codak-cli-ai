"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/components/common/toast";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring what Codak can do.",
    features: [
      "Basic Project Context",
      "Standard Chat Models",
      "50 Requests / Month",
      "Community Support",
    ],
    cta: "Start Free",
    recommended: false,
  },
  {
    name: "Pro",
    price: "$10",
    description: "For professionals who need serious power.",
    features: [
      "Deep Project Understanding",
      "Vision Support (Screenshot fixes)",
      "500 Requests / Month",
      "Custom .codakrules",
      "Priority Email Support",
    ],
    cta: "Upgrade to Pro",
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams with specific security and scale needs.",
    features: [
      "Unlimited Requests",
      "Bring Your Own Cloud / Models",
      "Massive Context Windows",
      "Team Roles & Shared Rules",
      "24/7 Dedicated Support",
    ],
    cta: "Contact Sales",
    recommended: false,
  }
];

export function Pricing() {
  const toast = useToast();
  const [loading] = useState(false);

  useEffect(() => {
    // Razorpay script loading removed for now
  }, []);

  const handleCheckout = async () => {
    toast.success("Payments coming soon! We are currently in Beta.");
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#080810] border-t border-zinc-900">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Choose the tier that fits your workflow. No hidden fees, no complicated tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "pro-card p-8 relative flex flex-col",
                tier.recommended ? "border-zinc-500 z-10" : "border-zinc-800"
              )}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 tracking-tight">{tier.name}</h3>
                <p className="text-zinc-400 text-sm h-10">{tier.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">{tier.price}</span>
                {tier.price !== "Custom" && <span className="text-zinc-400">/mo</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.recommended ? (
                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className={cn(
                    "w-full py-2.5 rounded-md text-center text-sm font-semibold transition-colors disabled:opacity-50",
                    "bg-white hover:bg-zinc-200 text-black" 
                  )}
                >
                  {loading ? "Processing..." : tier.cta}
                </button>
              ) : (
                <Link 
                  href="/login"
                  className={cn(
                    "w-full py-2.5 rounded-md text-center text-sm font-semibold transition-colors",
                    "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800"
                  )}
                >
                  {tier.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
