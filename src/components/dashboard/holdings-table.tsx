import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import type { HoldingRow } from "@/app/actions/portfolio";
import { StockLogo } from "@/components/ui/stock-logo";
import { SplitAction } from "@/components/dashboard/split-dialog";
import { formatMoney, formatQuantity } from "@/lib/format";

export function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="flex items-center justify-between gap-3 border-b border-[oklch(0.12_0.005_260)] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-[oklch(0.45_0.01_260)]" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
            Holdings
          </h2>
        </div>
        <span className="shrink-0 rounded-md bg-[oklch(0.10_0.005_260)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
          {holdings.length} positions
        </span>
      </div>

      {/* Mobile card list — visible only below md */}
      <ul className="divide-y divide-[oklch(0.10_0.005_260)] md:hidden">
        {holdings.length === 0 && (
          <li className="px-4 py-10 text-center text-[12px] text-[oklch(0.45_0.01_260)]">
            No holdings yet.
          </li>
        )}
        {holdings.map((h) => {
          const isPositive = h.pnl >= 0;
          return (
            <li key={h.ticker} className="flex flex-col gap-2.5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <StockLogo ticker={h.ticker} size={24} />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                        {h.ticker.replace(".JK", "")}
                      </span>
                      <SplitAction ticker={h.ticker} />
                      {h.hasMissingBuy && (
                        <span className="rounded-md bg-[oklch(0.15_0.04_25)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[oklch(0.70_0.15_25)]">
                          Missing Buy
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[10px] text-[oklch(0.40_0.01_260)]">
                      {h.name}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-[12px] font-semibold tabular-nums text-[oklch(0.90_0.005_260)]">
                    {formatMoney(h.marketValue, h.currency)}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${isPositive ? "text-[oklch(0.65_0.15_155)]" : "text-[oklch(0.65_0.15_25)]"}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? "+" : ""}{h.pnlPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pl-8.5 text-[11px] tabular-nums">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.06em] text-[oklch(0.38_0.01_260)]">Shares</span>
                  <span className="font-medium text-[oklch(0.78_0.005_260)]">{formatQuantity(h.shares)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.06em] text-[oklch(0.38_0.01_260)]">Avg</span>
                  <span className="font-medium text-[oklch(0.78_0.005_260)]">{formatMoney(h.avgPrice, h.currency)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.06em] text-[oklch(0.38_0.01_260)]">Last</span>
                  <span className="font-medium text-[oklch(0.78_0.005_260)]">{formatMoney(h.lastPrice, h.currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-8.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[oklch(0.12_0.005_260)]">
                  <div
                    className="h-full rounded-full bg-[oklch(0.70_0.08_230)] transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.min(Math.max(h.weight, 0), 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-medium tabular-nums text-[oklch(0.55_0.01_260)]">
                  {h.weight.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop table — visible md and up */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-225 text-sm">
        <thead>
          <tr className="border-b border-[oklch(0.12_0.005_260)]">
            {["Asset", "Sector", "Shares", "Avg Price", "Last Price", "Market Value", "P&L", "Weight"].map(
              (h) => (
                <th
                  key={h}
                  className={`h-10 px-6 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)] ${
                    ["Shares", "Avg Price", "Last Price", "Market Value", "P&L", "Weight"].includes(h)
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const isPositive = h.pnl >= 0;
            return (
              <tr
                key={h.ticker}
                className="border-b border-[oklch(0.10_0.005_260)] transition-colors hover:bg-[oklch(0.07_0.005_260)]"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {/* Smaller 24px Logo */}
                    <StockLogo ticker={h.ticker} size={24} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                          {h.ticker.replace(".JK", "")}
                        </span>
                        <SplitAction ticker={h.ticker} />
                        {h.hasMissingBuy && (
                          <span className="rounded-md bg-[oklch(0.15_0.04_25)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[oklch(0.70_0.15_25)]">
                            Missing Buy
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[oklch(0.40_0.01_260)]">{h.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className="rounded bg-[oklch(0.12_0.005_260)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.50_0.01_260)]">
                    {h.sector || "—"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right text-[12px] font-medium tabular-nums text-[oklch(0.80_0.005_260)]">
                  {formatQuantity(h.shares)}
                </td>
                <td className="px-6 py-3 text-right text-[12px] font-medium tabular-nums text-[oklch(0.80_0.005_260)]">
                  {formatMoney(h.avgPrice, h.currency)}
                </td>
                <td className="px-6 py-3 text-right text-[12px] font-medium tabular-nums text-[oklch(0.80_0.005_260)]">
                  {formatMoney(h.lastPrice, h.currency)}
                </td>
                <td className="px-6 py-3 text-right text-[12px] font-semibold tabular-nums text-[oklch(0.88_0.005_260)]">
                  {formatMoney(h.marketValue, h.currency)}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`flex items-center gap-1 text-[12px] font-semibold tabular-nums ${isPositive ? "text-[oklch(0.65_0.15_155)]" : "text-[oklch(0.65_0.15_25)]"}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatMoney(h.pnl, h.currency, { signed: true })}
                    </span>
                    <span className={`text-[10px] font-medium ${isPositive ? "text-[oklch(0.55_0.10_155)]" : "text-[oklch(0.55_0.10_25)]"}`}>
                      {isPositive ? "+" : ""}{h.pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                      {h.weight.toFixed(2)}%
                    </span>
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-[oklch(0.12_0.005_260)]">
                      <div
                        className="h-full rounded-full bg-[oklch(0.70_0.08_230)] transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.min(Math.max(h.weight, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
