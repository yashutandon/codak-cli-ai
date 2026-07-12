"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const existingToken = searchParams.get("token");
    const state = searchParams.get("state");

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

      if (!state) {
        // Web-only login
        localStorage.setItem("accessToken", finalToken);
        if (finalRefreshToken) localStorage.setItem("refreshToken", finalRefreshToken);
        window.location.href = "/";
        return;
      }

      try {
        let base64 = state.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        const port = payload.port;
        if (!port) throw new Error("Invalid port");
        
        const redirectUrl = new URL(`http://localhost:${port}/callback`);
        redirectUrl.searchParams.set("token", finalToken);
        redirectUrl.searchParams.set("state", state);
        if (finalRefreshToken) redirectUrl.searchParams.set("refreshToken", finalRefreshToken);
        
        window.location.href = redirectUrl.toString();
      } catch (e) {
        setError("Invalid state parameter. Try again.");
      }
    };
    
    processAuth();
  }, [searchParams]);

  const state = searchParams.get("state");

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "#fff", fontFamily: "monospace", flexDirection: "column", gap: "8px" }}>
        <p style={{ color: "#f87171" }}>Authentication failed: {error}</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>Close this window and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "#fff", fontFamily: "monospace", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Completing authentication...</p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
        {state ? "Redirecting back to CLI..." : "Redirecting..."}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
        Loading...
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}