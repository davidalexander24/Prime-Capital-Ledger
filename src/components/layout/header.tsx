"use client";

import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)]/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[oklch(0.35_0.01_260)]" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search tickers, transactions..."
            className="h-9 w-[280px] rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.06_0.005_260)] pl-9 pr-4 text-[13px] text-[oklch(0.80_0.005_260)] placeholder:text-[oklch(0.32_0.01_260)] outline-none transition-colors focus:border-[oklch(0.25_0.01_260)] focus:bg-[oklch(0.07_0.005_260)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-2 rounded-md bg-[oklch(0.10_0.005_260)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.45_0.01_260)]">
          IDX Market Open
        </span>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[oklch(0.14_0.005_260)] bg-transparent text-[oklch(0.45_0.01_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)] hover:text-[oklch(0.70_0.005_260)]">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.08_230)]" />
        </button>
      </div>
    </header>
  );
}
