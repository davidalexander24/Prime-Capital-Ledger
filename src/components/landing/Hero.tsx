"use client"

import Link from "next/link"
import { TrendingUp, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HeroChart } from "./HeroChart"

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.7 0.08 230) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.08 230) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: copy */}
          <div className="flex flex-col gap-7">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
            >
              <h1
                className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Your Indonesian portfolio.{" "}
                <span className="gradient-text">One ledger.</span>{" "}
                <span className="text-muted-foreground/70 font-light text-3xl sm:text-4xl lg:text-[2.75rem] tracking-normal block mt-1">
                  Fully in control.
                </span>
              </h1>
            </motion.div>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease }}
              className="text-base text-muted-foreground max-w-lg leading-relaxed"
            >
              Track IDR and USD holdings side by side, import brokerage PDFs
              automatically, and watch your real-time P&amp;L — built for
              Indonesian retail investors.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                asChild
                className="gap-2 font-semibold shadow-[0_0_24px_oklch(0.70_0.08_230/0.4)] hover:shadow-[0_0_36px_oklch(0.70_0.08_230/0.55)] transition-shadow duration-300"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-border/60 hover:border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground font-medium"
              >
                <Link href="/login">Log In</Link>
              </Button>
            </motion.div>
          </div>

          {/* Right: dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease }}
            className="flex justify-center lg:justify-end float-animation"
          >
            <div
              className="w-full max-w-[440px] rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm p-5 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6),0_0_40px_oklch(0.70_0.08_230/0.06)]"
              aria-label="Dashboard preview"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                    Total Portfolio Value
                  </p>
                  <p
                    className="text-3xl font-bold text-foreground mt-1 ticker-badge"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    $208,000
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-semibold text-emerald-400 ticker-badge">+108.0%</span>
                    <span className="text-[10px] text-muted-foreground">all time</span>
                  </div>
                </div>
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="size-5 text-primary" />
                </div>
              </div>

              <HeroChart />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "Holdings", value: "12 assets" },
                  { label: "Currency", value: "IDR + USD" },
                  { label: "P&L Today", value: "+2.4%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-muted/40 border border-border/40 px-3 py-2.5"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      {stat.label}
                    </p>
                    <p
                      className="text-xs font-semibold text-foreground mt-0.5 ticker-badge"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                <span className="relative flex size-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-1.5 bg-emerald-400" />
                </span>
                <span className="text-[10px] text-muted-foreground">Live · Updated 2 min ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
