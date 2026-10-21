import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import type { HoldingRow } from "@/app/actions/portfolio";
import { StockLogo } from "@/components/ui/stock-logo";
import { HoldingActions } from "@/components/dashboard/split-dialog";
import { rowMenuReveal } from "@/components/app/styles";
import { formatMoney, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

const headCell = "h-10 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-4";

function MissingBuyBadge() {
  return (
    <span
      title="Sells exceed recorded buys for this ticker"
      className="rounded-md bg-loss-wash px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.02em] text-loss"
    >
      Missing buy
    </span>
  );
}

export function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
  return (
    <div className="overflow-hidden surface-card">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-fg-4" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-fg-1">Holdings</h2>
        </div>
        <span className="shrink-0 rounded-md bg-layer-1 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-fg-3">
          {holdings.length} {holdings.length === 1 ? "position" : "positions"}
        </span>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-layer-1 text-fg-4">
            <Briefcase className="size-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-fg-2">No holdings yet</p>
            <p className="mt-1 text-[12px] text-fg-4">Positions appear here once you log or import a buy.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile card list, below md */}
          <ul className="divide-y divide-line-soft md:hidden">
            {holdings.map((h) => {
              const isPositive = h.pnl >= 0;
              return (
                <li key={h.ticker} className="flex flex-col gap-2.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <StockLogo ticker={h.ticker} size={24} />
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[13px] font-semibold text-fg-1">{h.ticker.replace(".JK", "")}</span>
                          {h.hasMissingBuy && <MissingBuyBadge />}
                        </div>
                        <span className="truncate text-[11px] text-fg-4">{h.name}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="flex flex-col items-end">
                        <span className="text-[13px] font-semibold tabular-nums text-fg-1">
                          {formatMoney(h.marketValue, h.currency)}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[12px] font-semibold tabular-nums",
                            isPositive ? "text-gain" : "text-loss"
                          )}
                        >
                          {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {isPositive ? "+" : ""}
                          {h.pnlPct.toFixed(2)}%
                        </span>
                      </div>
                      <HoldingActions ticker={h.ticker} className="-mr-1.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pl-8.5 text-[12px] tabular-nums">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.06em] text-fg-4">Shares</span>
                      <span className="font-medium text-fg-2">{formatQuantity(h.shares)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.06em] text-fg-4">Avg</span>
                      <span className="font-medium text-fg-2">{formatMoney(h.avgPrice, h.currency)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.06em] text-fg-4">Last</span>
                      <span className="font-medium text-fg-2">{formatMoney(h.lastPrice, h.currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-8.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-layer-2">
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.min(Math.max(h.weight, 0), 100)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-fg-3">
                      {h.weight.toFixed(2)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table, md and up */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr className="border-b border-line-soft">
                  <th className={cn(headCell, "pl-6 text-left")}>Asset</th>
                  <th className={cn(headCell, "text-right")}>Shares</th>
                  <th className={cn(headCell, "text-right")}>Avg price</th>
                  <th className={cn(headCell, "text-right")}>Last price</th>
                  <th className={cn(headCell, "text-right")}>Market value</th>
                  <th className={cn(headCell, "text-right")}>P&amp;L</th>
                  <th className={cn(headCell, "text-right")}>Weight</th>
                  <th className="h-10 w-12 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const isPositive = h.pnl >= 0;
                  return (
                    <tr key={h.ticker} className="group border-b border-line-soft transition-colors last:border-b-0 hover:bg-hover">
                      <td className="py-3 pr-4 pl-6">
                        <div className="flex items-center gap-3">
                          <StockLogo ticker={h.ticker} size={24} />
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-fg-1">{h.ticker.replace(".JK", "")}</span>
                              {h.hasMissingBuy && <MissingBuyBadge />}
                            </div>
                            <span title={h.name} className="max-w-56 truncate text-[11px] text-fg-4">
                              {h.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-medium tabular-nums text-fg-2">
                        {formatQuantity(h.shares)}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-medium tabular-nums text-fg-2">
                        {formatMoney(h.avgPrice, h.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-medium tabular-nums text-fg-2">
                        {formatMoney(h.lastPrice, h.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums text-fg-1">
                        {formatMoney(h.marketValue, h.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold tabular-nums",
                              isPositive ? "text-gain" : "text-loss"
                            )}
                          >
                            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                            {formatMoney(h.pnl, h.currency, { signed: true })}
                          </span>
                          <span className={cn("text-[11px] font-medium tabular-nums", isPositive ? "text-gain" : "text-loss")}>
                            {isPositive ? "+" : ""}
                            {h.pnlPct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[12px] font-medium tabular-nums text-fg-2">{h.weight.toFixed(2)}%</span>
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-layer-2">
                            <div
                              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                              style={{ width: `${Math.min(Math.max(h.weight, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="pr-6 text-right">
                        <HoldingActions ticker={h.ticker} className={cn("ml-auto", rowMenuReveal)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
