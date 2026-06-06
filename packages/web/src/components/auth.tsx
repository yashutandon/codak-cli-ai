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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

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
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleEmailAuth = async () => {
    if (isRegister && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(isRegister ? "Creating account..." : "Signing in...");

    try {
      const endpoint = isRegister
        ? "/api/v1/auth/register"
        : "/api/v1/auth/login";

      const body = isRegister
        ? { email, password, name }
        : { email, password };

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
      redirectToCLI(json.data.accessToken);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
        toastId
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "github" | "google") => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/${provider}?${params}`;
  };

  const redirectToCLI = (token: string) => {
    if (!state) return;
    try {
      const [encoded] = state.split(".");
      if (!encoded) throw new Error("Invalid state");
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
      const port = payload.port;
      window.location.href = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;
    } catch {
      toast.error("Invalid auth state. Please try again from the CLI.");
    }
  };

  const handleToggle = () => {
    setIsRegister(!isRegister);
    setConfirmPassword("");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="relative min-h-screen bg-[#080810] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            className="text-2xl font-bold text-white uppercase"
            style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.35em" }}
          >
            CODAK
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* OAuth */}
          <div className="flex flex-col gap-2.5 mb-6">
            <button
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all duration-150 disabled:opacity-40 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <button
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all duration-150 disabled:opacity-40 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs text-white/25 tracking-widest uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Form */}
          <div className="flex flex-col gap-2.5">
            {isRegister && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
                style={inputStyle}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => !isRegister && e.key === "Enter" && handleEmailAuth()}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
              style={inputStyle}
            />

            {isRegister && (
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
                style={inputStyle}
              />
            )}

            <button
              onClick={handleEmailAuth}
              disabled={loading || !email || !password || (isRegister && !confirmPassword)}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: "rgba(99,102,241,0.85)",
                border: "0.5px solid rgba(120,130,255,0.3)",
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  {isRegister ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                isRegister ? "Create account" : "Sign in"
              )}
            </button>
          </div>

          {/* Toggle */}
          <p className="mt-4 text-center text-xs text-white/30">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={handleToggle}
              disabled={loading}
              className="text-white/60 hover:text-white transition-colors underline underline-offset-2 cursor-pointer disabled:opacity-40"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          Authenticating for CLI session
        </p>
      </div>
    </div>
  );
}