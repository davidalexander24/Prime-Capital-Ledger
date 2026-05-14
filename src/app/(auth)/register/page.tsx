import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
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

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-[13px] text-[oklch(0.70_0.005_260)]">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            className="h-10 text-[14px]"
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
          />
        </div>
        
        <Button className="mt-2 h-10 w-full text-[14px]" type="submit" variant="default" asChild>
          <Link href="/dashboard" className="w-full">Create Account</Link>
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
