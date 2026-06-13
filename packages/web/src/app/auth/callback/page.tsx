"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const state = searchParams.get("state");

    if (!token || !state) {
      return;
    }

    try {
      const payload = JSON.parse(atob(state));
      const port = payload.port;
      if (!port) throw new Error("Invalid port");
      window.location.href = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;
    } catch {
      // error handled in UI
    }
  }, [searchParams]);

  const token = searchParams.get("token");
  const state = searchParams.get("state");

  if (!token || !state) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "#fff", fontFamily: "monospace", flexDirection: "column", gap: "8px" }}>
        <p style={{ color: "#f87171" }}>Authentication failed.</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>Close this window and try again from the CLI.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810", color: "#fff", fontFamily: "monospace", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Completing authentication...</p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>Redirecting back to CLI...</p>
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