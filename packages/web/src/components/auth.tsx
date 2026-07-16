"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "./common/toast";
import { Spinner } from "./common/loader";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    const dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 60; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,120,255,0.25)";
        ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i]!.x - dots[j]!.x;
          const dy = dots[i]!.y - dots[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(dots[i]!.x, dots[i]!.y);
            ctx.lineTo(dots[j]!.x, dots[j]!.y);
            ctx.strokeStyle = `rgba(120,120,255,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleEmailAuth = async () => {
    if (isRegister && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(isRegister ? "Creating account..." : "Signing in...");

    try {
      const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const body = isRegister ? { email, password, name } : { email, password };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Authentication failed");
      }

      toast.success(isRegister ? "Account created!" : "Welcome back!", toastId);
      handleRedirect(json.data.accessToken, json.data.refreshToken ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", toastId);
      setLoading(false);
    }
  };

  const handleRedirect = async (token: string, refreshToken = "") => {
    if (!state) {
      localStorage.setItem("accessToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      window.location.href = "/chat";
      return;
    }

    try {
      let base64 = state.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const payload = JSON.parse(atob(base64));
      const port = payload.port;
      
      const params = new URLSearchParams({ token, state, ...(refreshToken ? { refreshToken } : {}) });
      await fetch(`http://localhost:${port}/callback?${params}`, { mode: 'no-cors' });
      
      setAuthSuccess(true);
      setLoading(false);
    } catch (e) {
      toast.error("Failed to complete CLI authentication.");
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "github" | "google") => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/${provider}?${params}`;
  };

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)" };

  if (authSuccess) {
    return (
      <div className="relative min-h-screen bg-[#080810] flex flex-col items-center justify-center font-mono text-center px-4">
        <h1 className="text-white text-lg sm:text-xl tracking-[0.2em] mb-4">
          ✓ AUTHENTICATED
        </h1>
        <p className="text-[13px] text-white/40">
          You can close this tab and return to the CLI.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080810] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="mb-8 text-center">
          {state && <div className="mb-4 inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] tracking-widest uppercase border border-indigo-500/20">CLI Authentication</div>}
          <span className="text-2xl font-bold text-white uppercase" style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.35em" }}>CODAK</span>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
          <div className="flex flex-col gap-2.5 mb-6">
            <button onClick={() => handleOAuth("github")} disabled={loading} className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all duration-150 disabled:opacity-40 cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>Continue with GitHub</button>
            <button onClick={() => handleOAuth("google")} disabled={loading} className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all duration-150 disabled:opacity-40 cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>Continue with Google</button>
          </div>
          <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} /><span className="text-xs text-white/25 tracking-widest uppercase">or</span><div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
          <div className="flex flex-col gap-2.5">
            {isRegister && <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40" style={inputStyle} />}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40" style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40" style={inputStyle} />
            {isRegister && <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40" style={inputStyle} />}
            <button onClick={handleEmailAuth} disabled={loading || !email || !password || (isRegister && !confirmPassword)} className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2" style={{ background: "rgba(99,102,241,0.85)", border: "0.5px solid rgba(120,130,255,0.3)" }}>
              {loading ? <Spinner size="sm" /> : (isRegister ? "Create account" : "Sign in")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}