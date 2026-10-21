"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, XCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PasswordInput } from "@/components/auth/password-input";
import { authInput, authLabel, authSubmit, authSwitchText } from "@/components/auth/styles";
import { notice } from "@/components/app/styles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const isLoading = pendingLabel !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingLabel("Signing in...");
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        // One message for every credentials failure, so the page never says
        // whether an email has an account.
        setError("Invalid email or password");
      } else if (res?.ok) {
        // Stay pending until the dashboard replaces this page, so the button
        // never looks idle while the server is still rendering it.
        setPendingLabel("Opening dashboard...");
        router.replace("/dashboard");
        return;
      }
    } catch {
      setError("An unexpected error occurred");
    }

    setPendingLabel(null);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-1">Welcome back</h1>
        <p className="mt-1 text-sm text-fg-4">Sign in to access your investment dashboard</p>
      </div>

      <GoogleSignInButton label="Sign in with Google" disabled={isLoading} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div role="alert" className={notice({ tone: "error" })}>
            <XCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className={authLabel}>
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            className={authInput}
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={authLabel}>
            Password
          </label>
          <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={setPassword} />
        </div>

        <button id="login-submit" type="submit" className={`${authSubmit} mt-2`} disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              {pendingLabel}
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className={authSwitchText}>
        Don&apos;t have an account? <Link href="/register">Sign up</Link>
      </p>
    </div>
  );
}
