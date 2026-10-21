import { LogoMark } from "@/components/layout/logo-mark"

const REPO_URL = "https://github.com/davidalexander24/Prime-Capital-Ledger"

const footerLinks: Record<string, { label: string; href: string; external?: boolean }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Project: [
    { label: "Source on GitHub", href: REPO_URL, external: true },
    { label: "Sign in", href: "/login" },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/40">
      {/* top edge glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-[2fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="font-heading text-sm font-semibold text-foreground">Prime Capital Ledger</span>
            </div>
            <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              Portfolio management for retail investors. Track IDR &
              USD in one place.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, items]) => (
            <div key={col} className="flex flex-col gap-4">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {col}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Prime Capital Ledger. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Built for modern markets · IDX + NYSE</p>
        </div>
      </div>
    </footer>
  )
}
