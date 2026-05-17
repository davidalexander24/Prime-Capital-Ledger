"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LogoMark } from "@/components/layout/logo-mark";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Settings,
  Briefcase,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/import", label: "Import", icon: Upload },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Investor";

  const initials = displayName ? displayName.charAt(0).toUpperCase() : "I";

  return (
    <>
      {/* Mobile top header — hamburger + logo, only below lg */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[oklch(0.14_0.005_260)] bg-[oklch(0.04_0.005_260)]/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[oklch(0.65_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)] hover:text-[oklch(0.85_0.005_260)]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center"
          aria-label="Prime Capital — Dashboard"
        >
          <LogoMark size={28} />
        </Link>
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      {/* Backdrop — only below lg */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-65 flex-col border-r border-[oklch(0.14_0.005_260)] bg-[oklch(0.04_0.005_260)] transition-transform duration-200 ease-out lg:w-55 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[oklch(0.14_0.005_260)] px-4 lg:justify-center lg:px-0">
          <Link
            href="/dashboard"
            className="flex items-center"
            aria-label="Prime Capital — Dashboard"
          >
            <LogoMark size={36} />
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[oklch(0.65_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)] hover:text-[oklch(0.85_0.005_260)] lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <span className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.40_0.01_260)]">
            Menu
          </span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[oklch(0.12_0.01_230)] text-[oklch(0.70_0.08_230)]"
                    : "text-[oklch(0.50_0.01_260)] hover:bg-[oklch(0.08_0.005_260)] hover:text-[oklch(0.75_0.005_260)]"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 transition-colors duration-150 ${
                    isActive
                      ? "text-[oklch(0.70_0.08_230)]"
                      : "text-[oklch(0.40_0.01_260)] group-hover:text-[oklch(0.60_0.005_260)]"
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[oklch(0.14_0.005_260)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.14_0.005_260)] text-[11px] font-semibold text-[oklch(0.60_0.005_260)]">
              {initials}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                {displayName}
              </span>
              <span className="text-[10px] text-[oklch(0.40_0.01_260)]">
                Personal
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
