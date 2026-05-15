"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PortfolioValuationPoint } from "@/lib/types";

type PeriodId = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

const PERIODS: Array<{ id: PeriodId; label: string; longLabel: string }> = [
  { id: "1W", label: "1W", longLabel: "Past week" },
  { id: "1M", label: "1M", longLabel: "Past month" },
  { id: "3M", label: "3M", longLabel: "Past 3 months" },
  { id: "YTD", label: "YTD", longLabel: "Year to date" },
  { id: "1Y", label: "1Y", longLabel: "Past year" },
  { id: "ALL", label: "ALL", longLabel: "All time" },
];

interface ValuationChartProps {
  data: PortfolioValuationPoint[];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatValueAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function formatIDR(value: number): string {
  const rounded = Math.round(value);
  return `Rp${rounded.toLocaleString("id-ID")}`;
}

function formatSignedIDR(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatIDR(Math.abs(value))}`;
}

function sliceByPeriod(
  data: PortfolioValuationPoint[],
  period: PeriodId
): PortfolioValuationPoint[] {
  if (!data.length || period === "ALL") return data;

  const last = new Date(data[data.length - 1].date);
  let cutoff: Date;

  switch (period) {
    case "1W":
      cutoff = new Date(last);
      cutoff.setUTCDate(cutoff.getUTCDate() - 7);
      break;
    case "1M":
      cutoff = new Date(last);
      cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
      break;
    case "3M":
      cutoff = new Date(last);
      cutoff.setUTCMonth(cutoff.getUTCMonth() - 3);
      break;
    case "YTD":
      cutoff = new Date(Date.UTC(last.getUTCFullYear(), 0, 1));
      break;
    case "1Y":
      cutoff = new Date(last);
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
      break;
    default:
      return data;
  }

  const cutoffKey = cutoff.toISOString().split("T")[0];
  return data.filter((p) => p.date >= cutoffKey);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const marketValue = payload.find((p) => p.dataKey === "totalMarketValue");
  const costBasis = payload.find((p) => p.dataKey === "totalCostBasis");

  return (
    <div className="rounded-lg border border-[oklch(0.18_0.005_260)] bg-[oklch(0.06_0.005_260)] px-4 py-3 shadow-xl">
      <p className="mb-2 text-[11px] font-medium text-[oklch(0.50_0.01_260)]">
        {label ? formatTooltipDate(label) : ""}
      </p>
      {marketValue && (
        <p className="flex items-center gap-2 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.08_230)]" />
          <span className="text-[oklch(0.50_0.01_260)]">Market Value</span>
          <span className="ml-auto font-medium text-[oklch(0.90_0.005_260)]">
            {formatIDR(marketValue.value)}
          </span>
        </p>
      )}
      {costBasis && (
        <p className="mt-1 flex items-center gap-2 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.40_0.01_260)]" />
          <span className="text-[oklch(0.50_0.01_260)]">Cost Basis</span>
          <span className="ml-auto font-medium text-[oklch(0.70_0.005_260)]">
            {formatIDR(costBasis.value)}
          </span>
        </p>
      )}
    </div>
  );
}

export function ValuationChart({ data }: ValuationChartProps) {
  const [period, setPeriod] = useState<PeriodId>("ALL");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const sliced = useMemo(() => sliceByPeriod(data, period), [data, period]);
  const hasData = sliced.length > 1;

  const startPoint = sliced[0];
  const endPoint = sliced[sliced.length - 1];
  const activePoint =
    hoverIndex !== null && sliced[hoverIndex] ? sliced[hoverIndex] : endPoint;

  const activeValue = activePoint?.totalMarketValue ?? 0;
  // Change = growth in unrealized P&L over the period, so new contributions
  // don't inflate the figure. This makes the ALL view match the summary card.
  const startPnL = startPoint?.unrealizedPnL ?? 0;
  const activePnL = activePoint?.unrealizedPnL ?? 0;
  const change = activePnL - startPnL;
  const denom = activePoint?.totalCostBasis ?? 0;
  const changePct = denom > 0 ? (change / denom) * 100 : 0;
  const isUp = change >= 0;
  const accentColor = isUp
    ? "text-[oklch(0.72_0.16_155)]"
    : "text-[oklch(0.68_0.18_25)]";

  const { yDomain, baseValue } = useMemo(() => {
    if (!hasData) {
      return { yDomain: ["auto", "auto"] as const, baseValue: 0 };
    }
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const p of sliced) {
      const lo = Math.min(p.totalMarketValue, p.totalCostBasis);
      const hi = Math.max(p.totalMarketValue, p.totalCostBasis);
      if (lo < minVal) minVal = lo;
      if (hi > maxVal) maxVal = hi;
    }
    const range = maxVal - minVal;
    const bottomPad = range > 0 ? range * 0.15 : maxVal * 0.05 || 1;
    const topPad = range > 0 ? range * 0.05 : maxVal * 0.02 || 1;
    const floor = Math.max(0, minVal - bottomPad);
    return {
      yDomain: [floor, maxVal + topPad] as const,
      baseValue: floor,
    };
  }, [sliced, hasData]);

  const currentLabel = PERIODS.find((p) => p.id === period)?.longLabel ?? "";

  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="flex items-start justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
            Portfolio Valuation
          </h2>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)] tabular-nums">
              {formatIDR(activeValue)}
            </span>
            <span className={`text-[12px] font-medium tabular-nums ${accentColor}`}>
              {formatSignedIDR(change)} ({change >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%)
            </span>
            <span className="text-[11px] text-[oklch(0.45_0.01_260)]">
              {hoverIndex !== null && activePoint
                ? formatTooltipDate(activePoint.date)
                : currentLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-[oklch(0.70_0.08_230)]" />
            <span className="text-[10px] text-[oklch(0.45_0.01_260)]">Market Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-[oklch(0.30_0.005_260)]" />
            <span className="text-[10px] text-[oklch(0.45_0.01_260)]">Cost Basis</span>
          </div>
        </div>
      </div>

      <div className="px-2 py-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={sliced}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              onMouseMove={(state) => {
                const idx = state?.activeTooltipIndex;
                if (typeof idx === "number") {
                  setHoverIndex(idx);
                }
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="gradientMarket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.70 0.08 230)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="oklch(0.70 0.08 230)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="oklch(0.12 0.005 260)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "oklch(0.40 0.01 260)" }}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                tickFormatter={formatValueAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "oklch(0.40 0.01 260)" }}
                width={52}
                domain={yDomain}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "oklch(0.25 0.005 260)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="totalCostBasis"
                stroke="oklch(0.30 0.005 260)"
                strokeWidth={1.5}
                fill="none"
                dot={false}
                activeDot={false}
                baseValue={baseValue}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="totalMarketValue"
                stroke="oklch(0.70 0.08 230)"
                strokeWidth={2}
                fill="url(#gradientMarket)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "oklch(0.70 0.08 230)",
                  stroke: "oklch(0.05 0.005 260)",
                  strokeWidth: 2,
                }}
                baseValue={baseValue}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center px-6 text-center">
            <p className="text-[12px] text-[oklch(0.45_0.01_260)]">
              Not enough data in this period to draw a chart.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-[oklch(0.10_0.005_260)] px-4 py-3">
        {PERIODS.map((p) => {
          const isActive = p.id === period;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPeriod(p.id);
                setHoverIndex(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold tracking-[0.04em] transition-colors ${
                isActive
                  ? `bg-[oklch(0.10_0.005_260)] ${accentColor}`
                  : "text-[oklch(0.50_0.01_260)] hover:bg-[oklch(0.08_0.005_260)] hover:text-[oklch(0.75_0.005_260)]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
