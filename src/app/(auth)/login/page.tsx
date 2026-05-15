"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        // Handle common NextAuth errors
        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else {
          setError(res.error);
        }
      } else if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">
          Sign in to access your investment dashboard
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error-box">{error}</div>}

        {/* Email */}
        <div className="auth-field-group" style={{ marginBottom: 16 }}>
          <label className="auth-field-label">
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
          <label className="auth-field-label">
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
          style={{ marginTop: 20 }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
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