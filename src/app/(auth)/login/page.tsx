"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const isLoading = pendingLabel !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingLabel("Signing in...");
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else {
          setError(res.error);
        }
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
      {/* Back to landing */}
      <Link href="/" className="auth-back-btn" aria-label="Back to landing page">
        <ArrowLeft size={18} />
        <span>Back</span>
      </Link>

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">
          Sign in to access your investment dashboard
        </p>
      </div>

      <GoogleSignInButton label="Sign in with Google" disabled={isLoading} />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error-box">{error}</div>}

        {/* Email */}
        <div className="auth-field-group" style={{ marginBottom: 16 }}>
          <label htmlFor="login-email" className="auth-field-label">
            Email address<span className="auth-required">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="auth-field-group" style={{ marginBottom: 8 }}>
          <label htmlFor="login-password" className="auth-field-label">
            Password<span className="auth-required">*</span>
          </label>
          <div className="auth-field-wrapper" style={{ marginTop: 6 }}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="auth-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
          aria-busy={isLoading}
          style={{ marginTop: 20 }}
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {pendingLabel}
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Switch to register */}
      <p className="auth-switch-text">
        Don&apos;t have an account?{" "}
        <Link href="/register">Sign up</Link>
      </p>
    </div>
  );
}