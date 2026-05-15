import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { getPortfolioHoldings } from "@/app/actions/portfolio";

function formatIDR(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = (session.user as any).id;

  const res = await getPortfolioHoldings(userId);
  const holdings = res.success && res.data?.holdings ? res.data.holdings : [];
  
  const totalMarketValue = res.success && res.data ? res.data.totalMarketValue : 0;
  const totalCost = res.success && res.data ? res.data.totalCostBasis : 0;
  const totalPnl = res.success && res.data ? res.data.totalPnl : 0;
  const totalPnlPct = res.success && res.data ? res.data.totalPnlPct : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
          Portfolio
        </h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">
          Current holdings and position breakdown.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
            Total Market Value
          </span>
          <p className="mt-2 text-xl font-semibold text-[oklch(0.93_0.005_260)]">
            {formatIDR(totalMarketValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
            Total Cost Basis
          </span>
          <p className="mt-2 text-xl font-semibold text-[oklch(0.93_0.005_260)]">
            {formatIDR(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
            Unrealized P&L
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-xl font-semibold ${totalPnl >= 0 ? "text-[oklch(0.65_0.15_155)]" : "text-[oklch(0.65_0.15_25)]"}`}>
              {totalPnl >= 0 ? "+" : ""}{formatIDR(totalPnl)}
            </p>
            <span className={`text-sm font-medium ${totalPnl >= 0 ? "text-[oklch(0.65_0.15_155)]" : "text-[oklch(0.65_0.15_25)]"}`}>
              ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
        <div className="flex items-center justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[oklch(0.45_0.01_260)]" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
              Holdings
            </h2>
          </div>
          <span className="rounded-md bg-[oklch(0.10_0.005_260)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
            {holdings.length} positions
          </span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[oklch(0.12_0.005_260)]">
              {["Asset", "Sector", "Lots", "Avg Price", "Last Price", "Market Value", "P&L", "Weight"].map(
                (h) => (
                  <th
                    key={h}
                    className={`h-10 px-6 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)] ${
                      ["Lots", "Avg Price", "Last Price", "Market Value", "P&L", "Weight"].includes(h)
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
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                        {h.ticker}
                      </span>
                      <span className="text-[10px] text-[oklch(0.40_0.01_260)]">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded bg-[oklch(0.12_0.005_260)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.50_0.01_260)]">
                      {h.sector || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                    {h.lots}
                  </td>
                  <td className="px-6 py-3 text-right text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                    Rp {h.avgPrice.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-3 text-right text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                    Rp {h.lastPrice.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-3 text-right text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                    {formatIDR(h.marketValue)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`flex items-center gap-1 text-[12px] font-semibold ${isPositive ? "text-[oklch(0.65_0.15_155)]" : "text-[oklch(0.65_0.15_25)]"}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}{formatIDR(h.pnl)}
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
                          className="h-full rounded-full bg-[oklch(0.70_0.08_230)]"
                          style={{ width: `${Math.min(h.weight * 8, 100)}%` }}
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
