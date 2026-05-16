"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      onClick={() => {
        setPending(true);
        signOut({ callbackUrl: "/login" });
      }}
      disabled={pending}
      className="flex h-9 items-center gap-2 rounded-lg border border-[oklch(0.18_0.005_260)] bg-[oklch(0.08_0.005_260)] px-3 text-[12px] font-medium text-[oklch(0.80_0.005_260)] transition-colors hover:bg-[oklch(0.12_0.005_260)] disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
