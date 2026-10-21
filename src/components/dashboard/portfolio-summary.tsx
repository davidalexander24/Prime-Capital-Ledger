import { formatMoney } from "@/lib/format";

interface PortfolioSummaryProps {
  totalMarketValue: number;
  totalCost: number;
  baseCurrency: string;
  rate: number;
}

export function PortfolioSummary({ totalMarketValue, totalCost, baseCurrency, rate }: PortfolioSummaryProps) {
  const totalPnl = totalMarketValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="surface-card p-5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
          Total Market Value
        </span>
        <p className="mt-2 text-xl font-semibold tabular-nums text-fg-1">
          {formatMoney(totalMarketValue, baseCurrency)}
        </p>
        {baseCurrency === "IDR" && (
          <p className="mt-1 text-[10px] italic text-fg-4">
            Converted at 1 USD = {formatMoney(rate, "IDR")}
          </p>
        )}
      </div>
      <div className="surface-card p-5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
          Total Cost Basis
        </span>
        <p className="mt-2 text-xl font-semibold tabular-nums text-fg-1">
          {formatMoney(totalCost, baseCurrency)}
        </p>
      </div>
      <div className="surface-card p-5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
          Unrealized P&L
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <p className={`text-xl font-semibold tabular-nums ${totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
            {formatMoney(totalPnl, baseCurrency, { signed: true })}
          </p>
          <span className={`text-sm font-medium ${totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
            ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
