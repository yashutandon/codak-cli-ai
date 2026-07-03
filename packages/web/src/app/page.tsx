import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#080810] text-white selection:bg-zinc-800">
      <Navbar />
      <div className="flex-1">
        <Hero />
        <Features />
        <Pricing />
      </div>
      <Footer />
    </main>
  );
}
