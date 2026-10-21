import { TrendingUp, TrendingDown } from "lucide-react";
import type { TopTradedAsset } from "@/lib/types";
import { StockLogo } from "@/components/ui/stock-logo";
import { formatMoney, formatQuantity } from "@/lib/format";

interface TopTradedProps {
  data: TopTradedAsset[];
}

export function TopTraded({ data }: TopTradedProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
        <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
          Daily Movers
        </h2>
        <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
          Today&apos;s price change for your holdings
        </p>
      </div>

      {data.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-[12px] text-[oklch(0.45_0.01_260)]">
            No positions yet. Log a buy to see today&apos;s movers.
          </p>
        </div>
      ) : (
        <div className="movers-scroll max-h-96 flex-1 divide-y divide-[oklch(0.10_0.005_260)] overflow-y-auto">
          {data.map((asset, index) => {
            const isPositive = asset.changePercent >= 0;

            return (
              <div
                key={asset.ticker}
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[oklch(0.07_0.005_260)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.10_0.005_260)] text-[11px] font-bold text-[oklch(0.55_0.01_260)]">
                  {index + 1}
                </div>

                {/* Smaller 24px Logo */}
                <StockLogo ticker={asset.ticker} size={24} />

                <div className="flex min-w-0 flex-1 flex-col ml-1">
                  <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                    {asset.ticker.replace(".JK", "")}
                  </span>
                  <span className="truncate text-[11px] text-[oklch(0.40_0.01_260)]">
                    {asset.name}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold tabular-nums text-[oklch(0.88_0.005_260)]">
                      {formatMoney(asset.lastPrice, asset.currency)}
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
                  <span className="text-[10px] tabular-nums text-[oklch(0.38_0.01_260)]">
                    Holding {formatQuantity(asset.totalVolume)}{" "}
                    {asset.totalVolume === 1 ? "share" : "shares"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}