import { TrendingUp, TrendingDown, Wallet, BarChart3, Layers } from "lucide-react";
import type { PortfolioSummary } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface SummaryCardsProps {
  data: PortfolioSummary;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const lifetimePositive = data.lifetimePnL >= 0;

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
      value: formatMoney(data.totalValue, data.currency),
      icon: Wallet,
      detail: `Cost basis: ${formatMoney(data.totalCostBasis, data.currency)}`,
      extra: data.exchangeRate ? `Converted at 1 USD = ${formatMoney(data.exchangeRate, "IDR")}` : undefined,
    },
    {
      label: "Lifetime P&L",
      value: formatMoney(Math.abs(data.lifetimePnL), data.currency),
      prefix: lifetimePositive ? "+" : "-",
      icon: lifetimePositive ? TrendingUp : TrendingDown,
      accent: lifetimePositive,
      detail: `Realized ${formatMoney(data.realizedPnL, data.currency, { signed: true })} · Unrealized ${formatMoney(data.unrealizedPnL, data.currency, { signed: true })}`,
    },
    {
      label: "Total Return",
      value: `${data.lifetimeReturnPct.toFixed(2)}%`,
      prefix: lifetimePositive ? "+" : "",
      icon: BarChart3,
      accent: lifetimePositive,
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
          className="group relative overflow-hidden surface-card p-5 transition-colors duration-200 hover:border-line-strong"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
              {card.label}
            </span>
            <card.icon
              className={`h-4 w-4 ${
                card.accent
                  ? "text-gain"
                  : "text-fg-5"
              }`}
              strokeWidth={1.75}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            {card.prefix && (
              <span
                className={`text-sm font-medium ${
                  card.accent
                    ? "text-gain"
                    : "text-loss"
                }`}
              >
                {card.prefix}
              </span>
            )}
            <span className="text-xl font-semibold tracking-tight tabular-nums text-fg-1">
              {card.value}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-fg-4">
            {card.detail}
          </p>
          {card.extra && (
            <p className="mt-0.5 text-[11px] text-fg-4">
              {card.extra}
            </p>
          )}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}
