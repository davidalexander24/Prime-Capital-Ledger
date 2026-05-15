"use client";

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

interface ValuationChartProps {
  data: PortfolioValuationPoint[];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatValueAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return value.toLocaleString();
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
        {label ? formatDateShort(label) : ""}
      </p>
      {marketValue && (
        <p className="flex items-center gap-2 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.08_230)]" />
          <span className="text-[oklch(0.50_0.01_260)]">Market Value</span>
          <span className="ml-auto font-medium text-[oklch(0.90_0.005_260)]">
            Rp {(marketValue.value / 1_000_000).toFixed(1)}M
          </span>
        </p>
      )}
      {costBasis && (
        <p className="flex items-center gap-2 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.40_0.01_260)]" />
          <span className="text-[oklch(0.50_0.01_260)]">Cost Basis</span>
          <span className="ml-auto font-medium text-[oklch(0.70_0.005_260)]">
            Rp {(costBasis.value / 1_000_000).toFixed(1)}M
          </span>
        </p>
      )}
    </div>
  );
}

export function ValuationChart({ data }: ValuationChartProps) {
  const hasData = data.length > 0;
  const initialValue = data[0]?.totalMarketValue ?? 0;
  const yDomain = hasData
    ? [(dataMin: number) => Math.min(dataMin, initialValue), "dataMax"]
    : ["auto", "auto"];
  const baseValue = hasData ? initialValue : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="flex items-center justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
            Portfolio Valuation
          </h2>
          <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
            Market value vs. cost basis over time
          </p>
        </div>
        <div className="flex items-center gap-4">
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
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
