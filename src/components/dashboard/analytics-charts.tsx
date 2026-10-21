"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, TrendingUp, Activity, Target, Wallet
} from "lucide-react";
import { StockLogo } from "@/components/ui/stock-logo";
import { cn } from "@/lib/utils";
import type { AnalyticsMetric, MonthlyReturn, SectorAllocation } from "@/app/actions/analytics";

interface AnalyticsChartsProps {
  monthlyReturns: MonthlyReturn[];
  sectorAllocation: SectorAllocation[];
  metrics: AnalyticsMetric[];
}

// Categorical colors for the allocation donut, in fixed order. Validated on
// the card surface for adjacent and wrap-around pairs (colorblind and normal
// vision); a seventh hue failed against the first, so holdings past six fold
// into a neutral "Other" slice.
const ALLOCATION_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"];
const OTHER_COLOR = "oklch(0.45 0.01 262)";

const signedPercent = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

const tooltipStyle = {
  background: "var(--raised)",
  border: "1px solid var(--line-strong)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--fg-1)",
};

// Monthly return bar: green up, red down, with the data end rounded and the
// baseline end square, whichever direction the bar grows.
function ReturnBar(props: { x?: number; y?: number; width?: number; height?: number; payload?: MonthlyReturn }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const value = payload?.monthly ?? 0;
  const top = Math.min(y, y + height);
  const h = Math.abs(height);
  if (h === 0 || width === 0) return <g />;
  const r = Math.min(4, h / 2, width / 2);
  const right = x + width;
  const bottom = top + h;
  const d =
    value >= 0
      ? `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${right - r},${top} Q${right},${top} ${right},${top + r} L${right},${bottom} Z`
      : `M${x},${top} L${right},${top} L${right},${bottom - r} Q${right},${bottom} ${right - r},${bottom} L${x + r},${bottom} Q${x},${bottom} ${x},${bottom - r} Z`;
  return <path d={d} fill={value >= 0 ? "var(--gain)" : "var(--loss)"} />;
}

function allocationSlices(allocation: SectorAllocation[]) {
  const top = allocation.slice(0, ALLOCATION_COLORS.length).map((s, i) => ({
    ...s,
    color: ALLOCATION_COLORS[i],
    isOther: false,
  }));
  const rest = allocation.slice(ALLOCATION_COLORS.length);
  if (rest.length === 0) return top;
  const otherValue = Math.round(rest.reduce((sum, s) => sum + s.value, 0) * 10) / 10;
  return [
    ...top,
    { name: `Other (${rest.length})`, value: otherValue, color: OTHER_COLOR, isOther: true },
  ];
}

export function AnalyticsCharts({ monthlyReturns, sectorAllocation, metrics }: AnalyticsChartsProps) {
  const hasReturns = monthlyReturns?.length > 0;
  const hasSectors = sectorAllocation?.length > 0;
  const slices = allocationSlices(sectorAllocation ?? []);
  const cumulative = hasReturns ? monthlyReturns[monthlyReturns.length - 1].cumulative : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">{m.label}</span>
              {m.icon === "Target" && <Target className="size-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "Activity" && <Activity className="size-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "TrendingUp" && <TrendingUp className="size-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "BarChart3" && <BarChart3 className="size-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "Wallet" && <Wallet className="size-3.5 text-fg-5" strokeWidth={1.75} />}
            </div>
            <p className="mt-3 text-xl font-semibold text-fg-1">{m.value}</p>
            <p className="mt-1 text-[12px] text-fg-4">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="overflow-hidden surface-card lg:col-span-3">
          <div className="flex items-start justify-between gap-4 border-b border-line-soft px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-fg-1">Monthly returns</h2>
              <p className="mt-0.5 text-[12px] text-fg-4">Change in portfolio value each month</p>
            </div>
            {hasReturns && (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.08em] text-fg-4">Cumulative</p>
                <p className={cn("text-[15px] font-semibold tabular-nums", cumulative >= 0 ? "text-gain" : "text-loss")}>
                  {signedPercent(cumulative)}
                </p>
              </div>
            )}
          </div>
          <div className="px-2 py-4">
            {hasReturns ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyReturns} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--fg-4)" }}
                    interval="equidistantPreserveStart"
                    minTickGap={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--fg-4)" }}
                    tickFormatter={(v: number) => `${v}%`}
                    allowDecimals={false}
                    width={44}
                  />
                  <ReferenceLine y={0} stroke="var(--line-strong)" />
                  <Tooltip
                    cursor={{ fill: "var(--hover)" }}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "var(--fg-3)", marginBottom: 2 }}
                    // The custom bar shape sets no series fill, which Recharts
                    // would use as the item text color.
                    itemStyle={{ color: "var(--fg-1)" }}
                    formatter={(value) => [signedPercent(Number(value)), "Monthly return"]}
                  />
                  <Bar dataKey="monthly" maxBarSize={24} shape={ReturnBar} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-70 items-center justify-center px-6 text-center">
                <p className="text-[13px] text-fg-4">Not enough history yet. Monthly returns appear once you have transactions across more than one month.</p>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden surface-card lg:col-span-2">
          <div className="border-b border-line-soft px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-fg-1">Asset allocation</h2>
            <p className="mt-0.5 text-[12px] text-fg-4">Share of portfolio value by holding</p>
          </div>
          {hasSectors ? (
            <div className="flex flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:px-6">
              <div className="relative w-full sm:w-1/2">
                {/* Before the chart in the markup, so the tooltip paints over it. */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold text-fg-1">{sectorAllocation.length}</span>
                  <span className="text-[11px] text-fg-4">{sectorAllocation.length === 1 ? "holding" : "holdings"}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={slices}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      dataKey="value"
                      nameKey="name"
                      // A surface-colored edge separates neighbouring slices.
                      stroke="var(--surface)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {slices.map((s) => (
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: "var(--fg-1)" }}
                      formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name).replace(".JK", "")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex w-full flex-col gap-2.5 sm:w-1/2">
                {slices.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                      {!s.isOther && <StockLogo ticker={s.name} size={18} />}
                      <span className="truncate text-[12px] font-medium text-fg-3">{s.name.replace(".JK", "")}</span>
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums text-fg-2">{s.value.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-50 items-center justify-center px-6 py-4 text-center">
              <p className="text-[13px] text-fg-4">Asset breakdown isn&apos;t available yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
