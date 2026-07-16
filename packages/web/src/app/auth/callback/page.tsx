"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const state = searchParams.get("state");
  const isCLI = !!state;

  useEffect(() => {
    const code = searchParams.get("code");
    const existingToken = searchParams.get("token");

    const processAuth = async () => {
      let finalToken = existingToken;
      let finalRefreshToken = searchParams.get("refreshToken") ?? "";

      if (code) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/exchange-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            finalToken = json.data.accessToken;
            finalRefreshToken = json.data.refreshToken;
          } else {
            setError(json?.error?.message ?? "Code exchange failed");
            return;
          }
        } catch (e) {
          setError("Failed to communicate with auth server.");
          return;
        }
      }

      if (!finalToken) {
        if (!code) setError("No token or code received.");
        return;
      }

      if (!isCLI) {
        // Web-only login -> redirect to dashboard
        localStorage.setItem("accessToken", finalToken);
        if (finalRefreshToken) localStorage.setItem("refreshToken", finalRefreshToken);
        window.location.href = "/chat";
        return;
      }

      // CLI Login -> Send token to CLI local server via fetch
      try {
        let base64 = state.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        const port = payload.port;
        if (!port) throw new Error("Invalid port");
        
        const params = new URLSearchParams({
          token: finalToken,
          state: state!,
          ...(finalRefreshToken ? { refreshToken: finalRefreshToken } : {}),
        });

        await fetch(`http://localhost:${port}/callback?${params}`, {
          mode: "no-cors"
        }).catch(() => {
          // rare fallback if fetch fails
          window.location.href = `http://localhost:${port}/callback?${params}`;
        });
        
        setAuthSuccess(true);
      } catch (e) {
        setError("Invalid state parameter. Try again.");
      }
    };
    
    processAuth();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-sm w-full backdrop-blur-xl">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Authentication Failed</h2>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <p className="text-white/40 text-xs">You can close this window and try again.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-4 font-mono">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-white/80 text-sm mb-1">Completing authentication...</p>
        <p className="text-white/40 text-xs">{isCLI ? "Connecting to terminal" : "Redirecting to dashboard"}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}