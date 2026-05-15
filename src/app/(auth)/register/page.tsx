"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
          Create an account
        </h1>
        <p className="text-[13px] text-[oklch(0.50_0.01_260)]">
          Sign up to start managing your portfolio today
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-[13px] text-[oklch(0.70_0.005_260)]">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            className="h-10 text-[14px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          <Label htmlFor="password" className="text-[13px] text-[oklch(0.70_0.005_260)]">Password</Label>
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
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center text-[13px] text-[oklch(0.50_0.01_260)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[oklch(0.70_0.08_230)] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
