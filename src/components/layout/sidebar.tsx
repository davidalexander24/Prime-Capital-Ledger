"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import logoPrimeCapital from "@/assets/logoprimecaptial.png";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Settings,
  Briefcase,
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

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Investor";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IN";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-[oklch(0.14_0.005_260)] bg-[oklch(0.04_0.005_260)]">
      <div className="flex h-16 items-center justify-center border-b border-[oklch(0.14_0.005_260)] overflow-hidden">
        <Image
          src={logoPrimeCapital}
          alt="Prime Capital Logo"
          width={220}
          height={220}
          className="scale-[1.1] translate-y-[1px]"
          priority
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <span className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.40_0.01_260)]">
          Menu
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
              {displayName}
            </span>
            <span className="text-[10px] text-[oklch(0.40_0.01_260)]">
              Personal
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
