import { TrendingUp, TrendingDown, Wallet, BarChart3, Layers } from "lucide-react";
import type { PortfolioSummary } from "@/lib/types";

function formatIDR(value: number): string {
  const rounded = Math.round(Math.abs(value));
  return `Rp${rounded.toLocaleString("id-ID")}`;
}

function formatCurrency(value: number, currency: string): string {
  if (currency === "USD") {
    return `$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatIDR(value);
}

interface SummaryCardsProps {
  data: PortfolioSummary;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const isPositive = data.unrealizedPnL >= 0;

  const cards: Array<{
    label: string;
    value: string;
    icon: React.ElementType;
    detail: string;
    extra?: string;
    prefix?: string;
    accent?: boolean;
  }> = [
    {
      label: "Portfolio Value",
      value: formatCurrency(data.totalValue, data.currency),
      icon: Wallet,
      detail: `Cost basis: ${formatCurrency(data.totalCostBasis, data.currency)}`,
      extra: data.exchangeRate ? `Converted at 1 USD = Rp${data.exchangeRate.toLocaleString("id-ID")}` : undefined,
    },
    {
      label: "Unrealized P&L",
      value: formatCurrency(Math.abs(data.unrealizedPnL), data.currency),
      prefix: isPositive ? "+" : "-",
      icon: isPositive ? TrendingUp : TrendingDown,
      accent: isPositive,
      detail: `${isPositive ? "+" : ""}${data.totalReturnPct.toFixed(2)}% return`,
    },
    {
      label: "Total Return",
      value: `${data.totalReturnPct.toFixed(2)}%`,
      prefix: isPositive ? "+" : "",
      icon: BarChart3,
      accent: isPositive,
      detail: "Since inception",
    },
    {
      label: "Holdings",
      value: data.holdingsCount.toString(),
      icon: Layers,
      detail: "Active positions",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5 transition-colors duration-200 hover:border-[oklch(0.20_0.005_260)]"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
              {card.label}
            </span>
            <card.icon
              className={`h-4 w-4 ${
                card.accent
                  ? "text-[oklch(0.65_0.15_155)]"
                  : "text-[oklch(0.35_0.01_260)]"
              }`}
              strokeWidth={1.75}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            {card.prefix && (
              <span
                className={`text-sm font-medium ${
                  card.accent
                    ? "text-[oklch(0.65_0.15_155)]"
                    : "text-[oklch(0.60_0.18_25)]"
                }`}
              >
                {card.prefix}
              </span>
            )}
            <span className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
              {card.value}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[oklch(0.40_0.01_260)]">
            {card.detail}
          </p>
          {card.extra && (
            <p className="mt-0.5 text-[10px] italic text-[oklch(0.45_0.01_260)]">
              {card.extra}
            </p>
          )}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[oklch(0.08_0.005_260)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}
