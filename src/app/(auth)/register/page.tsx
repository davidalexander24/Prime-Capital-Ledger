"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Call your custom registration API route
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong during registration");
        setIsLoading(false);
        return;
      }

      // 2. Automatically log the user in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but failed to log in automatically.");
      } else if (signInRes?.ok) {
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
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-subheading">
          Sign up to start managing your portfolio with Prime Capital
        </p>
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error-box">{error}</div>}

        {/* Full Name */}
        <div className="auth-field-group" style={{ marginBottom: 16 }}>
          <label className="auth-field-label">
            Full name<span className="auth-required">*</span>
          </label>
          <input
            id="register-name"
            type="text"
            className="auth-input"
            placeholder="Enter your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="auth-field-group" style={{ marginBottom: 16 }}>
          <label className="auth-field-label">
            Email address<span className="auth-required">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            className="auth-input"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password + Confirm side by side */}
        <div className="auth-fields-row" style={{ marginBottom: 16 }}>
          <div className="auth-field-group">
            <label className="auth-field-label">
              Password<span className="auth-required">*</span>
            </label>
            <div className="auth-field-wrapper">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="auth-field-group">
            <label className="auth-field-label">
              Confirm password<span className="auth-required">*</span>
            </label>
            <div className="auth-field-wrapper">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="auth-checkbox-row">
          <input
            id="register-terms"
            type="checkbox"
            className="auth-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="register-terms" className="auth-checkbox-label">
            I agree to the{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </label>
        </div>

        {/* Submit */}
        <button
          id="register-submit"
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
          style={{ marginTop: 20 }}
        >
          {isLoading ? "Creating Account..." : "Create account"}
        </button>
      </form>

      {/* Switch to login */}
      <p className="auth-switch-text">
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
