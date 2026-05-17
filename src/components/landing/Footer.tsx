import Image from "next/image"
import logo from "@/assets/logoprimecaptial.png"

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-border/40">
      {/* top edge glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative size-8 overflow-hidden rounded-xl">
                <Image src={logo} alt="Prime Capital Ledger" fill className="object-contain" />
              </div>
              <span
                className="text-sm font-semibold text-foreground"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Prime Capital Ledger
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              Portfolio management for retail investors. Track IDR &
              USD in one place.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, items]) => (
            <div key={col} className="flex flex-col gap-4">
              <p
                className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {col}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-6">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Prime Capital Ledger. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Built for modern markets · IDX + NYSE
          </p>
        </div>
      </div>
    </footer>
  )
}
