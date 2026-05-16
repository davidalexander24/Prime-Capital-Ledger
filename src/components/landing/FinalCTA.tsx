"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "./ScrollReveal"

export function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="relative rounded-3xl border border-border/60 overflow-hidden py-24 px-6 text-center">
            {/* Multi-layer background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {/* Base */}
              <div className="absolute inset-0 bg-card/40" />
              {/* Primary glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/[0.09] blur-[100px]" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-[300px] h-[200px] bg-primary/[0.05] blur-[60px]" />
              <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-primary/[0.05] blur-[60px]" />
              {/* Grid lines */}
              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    "linear-gradient(oklch(0.7 0.08 230) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.08 230) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              {/* Top border glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            <div className="relative flex flex-col items-center gap-7">
              {/* Label */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
              >
                Start Today
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.06 }}
                className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl max-w-2xl"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Ready to take control of your{" "}
                <span className="gradient-text">portfolio?</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-base text-muted-foreground max-w-md leading-relaxed"
              >
                Join investors tracking their IDX and US holdings in one place.
                Free to start, no credit card needed.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <Button
                  size="lg"
                  asChild
                  className="gap-2 font-semibold px-8 shadow-[0_0_32px_oklch(0.70_0.08_230/0.45)] hover:shadow-[0_0_48px_oklch(0.70_0.08_230/0.6)] transition-shadow duration-300"
                >
                  <Link href="/register">
                    Get Started Free
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-foreground font-medium"
                >
                  <Link href="/login">Already have an account →</Link>
                </Button>
              </motion.div>

              {/* Trust note */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="text-xs text-muted-foreground/60"
              >
                No credit card · Google Sign-In supported · Data stays yours
              </motion.p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
