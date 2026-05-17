"use client"

import { motion } from "framer-motion"
import { ScrollReveal, StaggerContainer, staggerItem } from "./ScrollReveal"

const features = [
  {
    title: "Multi-currency tracking",
    description:
      "Hold IDR and USD positions side by side. Live FX conversion keeps every line in one base view.",
  },
  {
    title: "Brokerage PDF import",
    description:
      "Drop in statements from broker apps. Trades are parsed, deduped, and ready in seconds.",
  },
  {
    title: "Real-time P&L",
    description:
      "Quotes refresh every fifteen minutes. Unrealised gains and cost basis update with each tick.",
  },
  {
    title: "Historical valuation",
    description:
      "A clean timeline of your portfolio value. Replay every deposit, sell, and market move.",
  },
  {
    title: "Transaction ledger",
    description:
      "Every fill, fee, and transfer in one immutable list. Filter, search, and audit without friction.",
  },
  {
    title: "Secure authentication",
    description:
      "Google OAuth or email. Sessions are JWT-signed and your data stays scoped to your account.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header — magazine-style two-column */}
        <ScrollReveal className="mb-20 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              <span className="ticker-badge">§ 01</span>
              <span className="h-px w-8 bg-border" />
              <span>Features</span>
            </div>
          </div>
          <h2
            className="md:col-span-9 text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] leading-[1.15]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Everything you need to run a portfolio
            <span className="text-muted-foreground/60">
              {" "}- nothing you don&apos;t.
            </span>
          </h2>
        </ScrollReveal>

        {/* Editorial card grid — large numerals, strong type, no chrome */}
        <StaggerContainer
          className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.06}
        >
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              variants={staggerItem}
              tabIndex={0}
              className="group relative pt-7 outline-none"
            >
              {/* Top hairline — extends to right on hover */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-10 bg-foreground transition-[width] duration-500 ease-out group-hover:w-full group-focus-visible:w-full"
              />

              {/* Title row */}
              <div className="mb-3">
                <h3
                  className="text-xl font-medium text-foreground tracking-tight leading-snug"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {f.title}
                </h3>
              </div>

              <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[34ch]">
                {f.description}
              </p>
            </motion.article>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
