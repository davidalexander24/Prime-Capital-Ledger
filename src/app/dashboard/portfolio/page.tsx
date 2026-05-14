import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { getPortfolioHoldings } from "@/app/actions/portfolio";
import type { HoldingRow } from "@/app/actions/portfolio";

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "";

const dummyHoldings: HoldingRow[] = [
  {
    ticker: "BBCA",
    name: "Bank Central Asia Tbk",
    sector: "Financials",
    lots: 85,
    avgPrice: 9_840,
    lastPrice: 10_225,
    marketValue: 86_912_500,
    costBasis: 83_640_000,
    pnl: 3_272_500,
    pnlPct: 3.91,
    weight: 10.25,
  },
  {
    ticker: "BBRI",
    name: "Bank Rakyat Indonesia Tbk",
    sector: "Financials",
    lots: 120,
    avgPrice: 4_650,
    lastPrice: 4_870,
    marketValue: 58_440_000,
    costBasis: 55_800_000,
    pnl: 2_640_000,
    pnlPct: 4.73,
    weight: 6.89,
  },
  {
    ticker: "TLKM",
    name: "Telkom Indonesia Tbk",
    sector: "Telecom",
    lots: 150,
    avgPrice: 3_720,
    lastPrice: 3_890,
    marketValue: 58_350_000,
    costBasis: 55_800_000,
    pnl: 2_550_000,
    pnlPct: 4.57,
    weight: 6.88,
  },
  {
    ticker: "BMRI",
    name: "Bank Mandiri Tbk",
    sector: "Financials",
    lots: 60,
    avgPrice: 6_580,
    lastPrice: 6_750,
    marketValue: 40_500_000,
    costBasis: 39_480_000,
    pnl: 1_020_000,
    pnlPct: 2.58,
    weight: 4.78,
  },
  {
    ticker: "ASII",
    name: "Astra International Tbk",
    sector: "Industrials",
    lots: 70,
    avgPrice: 5_280,
    lastPrice: 5_425,
    marketValue: 37_975_000,
    costBasis: 36_960_000,
    pnl: 1_015_000,
    pnlPct: 2.75,
    weight: 4.48,
  },
  {
    ticker: "ICBP",
    name: "Indofood CBP Sukses Makmur",
    sector: "Consumer Staples",
    lots: 25,
    avgPrice: 11_600,
    lastPrice: 11_850,
    marketValue: 29_625_000,
    costBasis: 29_000_000,
    pnl: 625_000,
    pnlPct: 2.16,
    weight: 3.50,
  },
  {
    ticker: "UNVR",
    name: "Unilever Indonesia Tbk",
    sector: "Consumer Staples",
    lots: 40,
    avgPrice: 3_350,
    lastPrice: 3_210,
    marketValue: 12_840_000,
    costBasis: 13_400_000,
    pnl: -560_000,
    pnlPct: -4.18,
    weight: 1.51,
  },
  {
    ticker: "GOTO",
    name: "GoTo Gojek Tokopedia Tbk",
    sector: "Technology",
    lots: 500,
    avgPrice: 68,
    lastPrice: 74,
    marketValue: 3_700_000,
    costBasis: 3_400_000,
    pnl: 300_000,
    pnlPct: 8.82,
    weight: 0.44,
  },
];

function formatIDR(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default async function PortfolioPage() {
  let holdings = dummyHoldings;
  let totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  let totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  let totalPnl = totalMarketValue - totalCost;
  let totalPnlPct = (totalPnl / totalCost) * 100;

  if (DEFAULT_USER_ID) {
    const res = await getPortfolioHoldings(DEFAULT_USER_ID);
    if (res.success && res.data && res.data.holdings.length > 0) {
      holdings = res.data.holdings;
      totalMarketValue = res.data.totalMarketValue;
      totalCost = res.data.totalCostBasis;
      totalPnl = res.data.totalPnl;
      totalPnlPct = res.data.totalPnlPct;
    }
  }

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
