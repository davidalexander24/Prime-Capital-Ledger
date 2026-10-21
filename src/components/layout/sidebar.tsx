"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";
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

// Logo, links and user card, shared by the desktop sidebar and the mobile
// drawer. closeButton is only passed in the drawer.
function SidebarContent({
  pathname,
  displayName,
  closeButton,
  onNavigate,
}: {
  pathname: string;
  displayName: string;
  closeButton?: React.ReactNode;
  onNavigate?: () => void;
}) {
  const initials = displayName.charAt(0).toUpperCase() || "I";

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-line px-4 lg:justify-center lg:px-0">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center" aria-label="Prime Capital Ledger, overview">
          <LogoMark size={36} />
        </Link>
        {closeButton}
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <span className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-4" aria-hidden="true">
          Menu
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                isActive ? "bg-brand-wash text-brand" : "text-fg-3 hover:bg-hover hover:text-fg-1"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 transition-colors duration-150",
                  isActive ? "text-brand" : "text-fg-4 group-hover:text-fg-2"
                )}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-layer-3 text-[11px] font-semibold text-fg-3" aria-hidden="true">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-medium text-fg-2">{displayName}</span>
            <span className="text-[11px] text-fg-4">Personal</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes, adjusted during render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "Investor";

  return (
    <>
      {/* Mobile: top bar plus a modal drawer (focus trap, Escape, scroll lock) */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-line bg-panel/95 px-4 backdrop-blur-xl lg:hidden">
          <DialogPrimitive.Trigger
            aria-label="Open navigation menu"
            className="flex size-9 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-hover hover:text-fg-1"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </DialogPrimitive.Trigger>
          <Link href="/dashboard" className="flex items-center" aria-label="Prime Capital Ledger, overview">
            <LogoMark size={28} />
          </Link>
          <div className="size-9" aria-hidden="true" />
        </header>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 lg:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed top-0 left-0 z-50 flex h-dvh w-65 flex-col border-r border-line bg-panel outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <SidebarContent
              pathname={pathname}
              displayName={displayName}
              onNavigate={() => setOpen(false)}
              closeButton={
                <DialogPrimitive.Close
                  aria-label="Close navigation menu"
                  className="flex size-9 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-hover hover:text-fg-1"
                >
                  <X className="size-5" strokeWidth={1.75} />
                </DialogPrimitive.Close>
              }
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Desktop: static sidebar */}
      <aside className="fixed top-0 left-0 z-30 hidden h-dvh w-55 flex-col border-r border-line bg-panel lg:flex">
        <SidebarContent pathname={pathname} displayName={displayName} />
      </aside>
    </>
  );
}
