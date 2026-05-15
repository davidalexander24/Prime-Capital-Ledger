import { TrendingUp, TrendingDown } from "lucide-react";
import type { TopTradedAsset } from "@/lib/types";

interface TopTradedProps {
  data: TopTradedAsset[];
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

function formatIDR(value: number): string {
  const rounded = Math.round(Math.abs(value));
  return `Rp${rounded.toLocaleString("id-ID")}`;
}

function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

function formatCurrency(value: number, currency?: string): string {
  return currency === "USD" ? formatUSD(value) : formatIDR(value);
}

export function TopTraded({ data }: TopTradedProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
        <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
          Top Traded Assets
        </h2>
        <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
          Most active tickers by volume
        </p>
      </div>

      <div className="divide-y divide-[oklch(0.10_0.005_260)]">
        {data.map((asset, index) => {
          const isPositive = asset.changePercent >= 0;

          return (
            <div
              key={asset.ticker}
              className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[oklch(0.07_0.005_260)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[oklch(0.10_0.005_260)] text-[11px] font-bold text-[oklch(0.55_0.01_260)]">
                {index + 1}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                    {asset.ticker}
                  </span>
                  <span className="rounded bg-[oklch(0.12_0.005_260)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.50_0.01_260)]">
                    {asset.sector}
                  </span>
                </div>
                <span className="truncate text-[11px] text-[oklch(0.40_0.01_260)]">
                  {asset.name}
                </span>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                    {formatCurrency(asset.lastPrice, asset.currency)}
                  </span>
                  <div
                    className={`flex items-center gap-0.5 text-[11px] font-medium ${
                      isPositive
                        ? "text-[oklch(0.65_0.15_155)]"
                        : "text-[oklch(0.65_0.15_25)]"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" strokeWidth={2} />
                    ) : (
                      <TrendingDown className="h-3 w-3" strokeWidth={2} />
                    )}
                    {isPositive ? "+" : ""}
                    {asset.changePercent.toFixed(2)}%
                  </div>
                </div>
                <span className="text-[10px] text-[oklch(0.38_0.01_260)]">
                  Vol {formatVolume(asset.totalVolume)} · {asset.tradeCount} trades
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
