"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import logoPrimeCapital from "@/assets/logoprimecaptial.png"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
]

function smoothScrollTo(id: string) {
  const el = document.querySelector(id)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const sections = navLinks.map((l) => l.href.replace("#", ""))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: "-40% 0px -50% 0px" }
    )
    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      smoothScrollTo(href)
      setOpen(false)
    },
    []
  )

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as [number,number,number,number] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 backdrop-blur-xl border-b",
        scrolled
          ? "bg-background/85 border-border/60 shadow-[0_1px_40px_rgba(0,0,0,0.45)]"
          : "bg-background/60 border-border/30 shadow-[0_1px_24px_rgba(0,0,0,0.25)]"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo — full wordmark image (icon + Prime Capital), content cropped from PNG */}
        <Link
          href="/"
          aria-label="Prime Capital Ledger — Home"
          className="group flex items-center"
        >
          <div
            role="img"
            aria-label="Prime Capital Ledger"
            className="h-12 w-[200px] bg-no-repeat bg-center transition-transform duration-300 group-hover:scale-[1.04]"
            style={{
              backgroundImage: `url(${logoPrimeCapital.src})`,
              backgroundSize: "220px 220px",
              backgroundPosition: "-15px -85px",
            }}
          />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => handleNavClick(e, l.href)}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  activeSection === l.href.replace("#", "")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {l.label}
                {activeSection === l.href.replace("#", "") && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-muted/50"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            <Link href="/login">Log In</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_oklch(0.70_0.08_230/0.35)] hover:shadow-[0_0_24px_oklch(0.70_0.08_230/0.5)] transition-shadow duration-300"
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="md:hidden">
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background/95 backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <div
                  role="img"
                  aria-label="Prime Capital Ledger"
                  className="h-11 w-[180px] bg-no-repeat"
                  style={{
                    backgroundImage: `url(${logoPrimeCapital.src})`,
                    backgroundSize: "198px 198px",
                    backgroundPosition: "-14px -77px",
                  }}
                />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 py-6">
              {navLinks.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleNavClick(e, l.href)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-2 rounded-lg hover:bg-muted/40 border-b border-border/40"
                >
                  {l.label}
                </motion.a>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button asChild className="shadow-[0_0_16px_oklch(0.70_0.08_230/0.35)]">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Get Started Free
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  )
}
