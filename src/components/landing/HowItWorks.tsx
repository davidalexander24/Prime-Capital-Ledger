"use client"

import { motion } from "framer-motion"
import { ScrollReveal, StaggerContainer, staggerItem } from "./ScrollReveal"

const steps = [
  {
    step: "01",
    title: "Sign up & connect",
    description:
      "Create an account in seconds with Google or email. No credit card required, no hidden fees.",
    highlight: "Free forever to start",
  },
  {
    step: "02",
    title: "Import or log transactions",
    description:
      "Upload brokerage PDFs from Ajaib or Stockbit, or log trades manually — your choice, anytime.",
    highlight: "Ajaib & Stockbit supported",
  },
  {
    step: "03",
    title: "Track & analyze",
    description:
      "Watch your portfolio grow with live valuations, historical charts, and real-time P&L in IDR or USD.",
    highlight: "Live every 15 minutes",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      {/* Section dividers */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Section header — magazine-style */}
        <ScrollReveal className="mb-20 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              <span className="ticker-badge">§ 02</span>
              <span className="h-px w-8 bg-border" />
              <span>How It Works</span>
            </div>
          </div>
          <h2
            className="md:col-span-9 text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] leading-[1.15]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Up and running in minutes
            <span className="text-muted-foreground/60">
              {" "}— three steps, no setup theatre.
            </span>
          </h2>
        </ScrollReveal>

        {/* Steps — typography-driven, no icon containers */}
        <StaggerContainer
          className="relative grid gap-x-10 gap-y-14 md:grid-cols-3"
          staggerDelay={0.12}
        >
          {steps.map((step) => (
            <motion.article
              key={step.title}
              variants={staggerItem}
              className="group relative pt-7"
            >
              {/* Hairline top — animates to full width on hover */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-10 bg-foreground transition-[width] duration-500 ease-out group-hover:w-full"
              />

              {/* Big step numeral */}
              <p
                className="text-[3.5rem] leading-none font-light text-foreground/85 tracking-tight ticker-badge"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {step.step}
              </p>

              <h3
                className="mt-6 text-xl font-medium text-foreground tracking-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {step.title}
              </h3>

              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-[34ch]">
                {step.description}
              </p>

              {/* Highlight — a quiet ticker line, no pill chrome */}
              <p className="mt-5 flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground/80">
                <span aria-hidden="true" className="h-px w-4 bg-muted-foreground/60" />
                {step.highlight}
              </p>
            </motion.article>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
