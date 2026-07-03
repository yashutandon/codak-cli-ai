"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken") ?? "";
    const state = searchParams.get("state");

    if (!token) {
      return;
    }

    if (!state) {
      // Web-only login
      localStorage.setItem("accessToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      window.location.href = "/";
      return;
    }

    try {
      const payload = JSON.parse(atob(state));
      const port = payload.port;
      if (!port) throw new Error("Invalid port");
      
      const redirectUrl = new URL(`http://localhost:${port}/callback`);
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("state", state);
      if (refreshToken) redirectUrl.searchParams.set("refreshToken", refreshToken);
      
      window.location.href = redirectUrl.toString();
    } catch {
      // error handled in UI
    }
  }, [searchParams]);

  const token = searchParams.get("token");
  const state = searchParams.get("state");

  if (!token) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "#fff", fontFamily: "monospace", flexDirection: "column", gap: "8px" }}>
        <p style={{ color: "#f87171" }}>Authentication failed.</p>
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