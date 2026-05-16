"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPending(true);
          signIn("google", { callbackUrl: "/dashboard" });
        }}
        disabled={pending}
        style={{
          width: "100%",
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "0 14px",
          borderRadius: 8,
          border: "1px solid oklch(0.18 0.005 260)",
          background: "oklch(0.08 0.005 260)",
          color: "oklch(0.85 0.005 260)",
          fontSize: 13,
          fontWeight: 500,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
          transition: "background-color 150ms",
        }}
        onMouseEnter={(e) => {
          if (!pending) e.currentTarget.style.background = "oklch(0.12 0.005 260)";
        }}
        onMouseLeave={(e) => {
          if (!pending) e.currentTarget.style.background = "oklch(0.08 0.005 260)";
        }}
      >
        <GoogleGlyph />
        {pending ? "Redirecting…" : label}
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "16px 0",
          fontSize: 11,
          color: "oklch(0.40 0.01 260)",
          letterSpacing: "0.08em",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "oklch(0.14 0.005 260)" }} />
        <span>OR</span>
        <div style={{ flex: 1, height: 1, background: "oklch(0.14 0.005 260)" }} />
      </div>
    </>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.3 5.2C41.3 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
