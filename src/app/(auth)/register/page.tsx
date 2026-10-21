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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const isLoading = pendingLabel !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPendingLabel("Creating account...");
    const cleanEmail = email.trim();

    try {
      // custom registration API route
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong during registration");
        setPendingLabel(null);
        return;
      }

      setPendingLabel("Signing in...");
      const signInRes = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but failed to log in automatically.");
      } else if (signInRes?.ok) {
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
        <h1 className="text-2xl font-semibold tracking-tight text-fg-1">Create your account</h1>
        <p className="mt-1 text-sm text-fg-4">Sign up to start managing your portfolio with Prime Capital</p>
      </div>

      <GoogleSignInButton label="Sign up with Google" disabled={isLoading} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div role="alert" className={notice({ tone: "error" })}>
            <XCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="register-name" className={authLabel}>
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            className={authInput}
            placeholder="Your name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="register-email" className={authLabel}>
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            className={authInput}
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <div>
            <label htmlFor="register-password" className={authLabel}>
              Password
            </label>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={setPassword}
            />
          </div>
          <div>
            <label htmlFor="register-confirm-password" className={authLabel}>
              Confirm password
            </label>
            <PasswordInput
              id="register-confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>
        </div>
        <p className="-mt-2 text-[12px] text-fg-4">At least 8 characters.</p>

        <button id="register-submit" type="submit" className={`${authSubmit} mt-2`} disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              {pendingLabel}
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className={authSwitchText}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
