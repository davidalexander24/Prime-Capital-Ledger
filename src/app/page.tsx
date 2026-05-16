import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { FeaturesGrid } from "@/components/landing/FeaturesGrid"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/landing/Footer"
import Aurora from "@/components/landing/Aurora"

export const metadata: Metadata = {
  title: "Prime Capital Ledger — Portfolio Management for Indonesian Markets",
  description:
    "Track your IDR and USD holdings, import brokerage PDFs, and see real-time P&L. Built for Indonesian retail investors.",
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="relative isolate">
      {/* Aurora WebGL background — anchored to viewport top, behind hero */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[110vh] opacity-80"
        aria-hidden="true"
      >
        <Aurora
          colorStops={["#3B82F6", "#94a3b8", "#06B6D4"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </div>

      {/* Soft mesh gradient layered below Aurora for depth on lower sections */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.70 0.08 230 / 0.06) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 20% 60%, oklch(0.75 0.06 250 / 0.04) 0%, transparent 55%)",
        }}
      />

      <Navbar />
      <main>
        <Hero />
        <FeaturesGrid />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
