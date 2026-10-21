"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { appButton } from "@/components/app/styles";

export function GoogleSignInButton({
  label = "Continue with Google",
  disabled = false,
}: {
  label?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);

  // Coming back from Google with the Back button restores this page from the
  // bfcache with pending still set, which would leave the button stuck.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPending(true);
          signIn("google", { callbackUrl: "/dashboard" }).catch(() => setPending(false));
        }}
        disabled={pending || disabled}
        aria-busy={pending}
        className={cn(appButton({ tone: "secondary" }), "h-11 w-full gap-2.5 bg-sunken text-[13px] font-medium aria-busy:cursor-progress")}
      >
        {pending ? <Loader2 className="animate-spin" /> : <GoogleGlyph />}
        {pending ? "Redirecting to Google…" : label}
      </button>
      <div className="my-4 flex items-center gap-3 text-[11px] tracking-[0.08em] text-fg-4" aria-hidden="true">
        <div className="h-px flex-1 bg-line" />
        OR
        <div className="h-px flex-1 bg-line" />
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
