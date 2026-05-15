"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
          Welcome back
        </h1>
        <p className="text-[13px] text-[oklch(0.50_0.01_260)]">
          Enter your email and password to access your dashboard
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[13px] text-[oklch(0.70_0.005_260)]">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            className="h-10 text-[14px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[13px] text-[oklch(0.70_0.005_260)]">Password</Label>
            <Link href="#" className="text-[12px] font-medium text-[oklch(0.70_0.08_230)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            className="h-10 text-[14px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <Button className="mt-2 h-10 w-full text-[14px]" type="submit" variant="default" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center text-[13px] text-[oklch(0.50_0.01_260)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[oklch(0.70_0.08_230)] hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}