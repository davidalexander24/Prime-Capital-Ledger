"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { appButton } from "@/components/app/styles";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setPending(true);
        signOut({ callbackUrl: "/login" });
      }}
      disabled={pending}
      className={appButton({ tone: "secondary" })}
    >
      <LogOut strokeWidth={2} />
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
