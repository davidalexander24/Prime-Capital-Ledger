"use client";

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from "recharts";
import {
  BarChart3, TrendingUp, Activity, Target, Wallet
} from "lucide-react";
import { StockLogo } from "@/components/ui/stock-logo";
import type { AnalyticsMetric, MonthlyReturn, SectorAllocation } from "@/app/actions/analytics";

interface AnalyticsChartsProps {
  monthlyReturns: MonthlyReturn[];
  sectorAllocation: SectorAllocation[];
  metrics: AnalyticsMetric[];
}

export function AnalyticsCharts({ monthlyReturns, sectorAllocation, metrics }: AnalyticsChartsProps) {
  const hasReturns = monthlyReturns?.length > 0;
  const hasSectors = sectorAllocation?.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">{m.label}</span>
              {m.icon === "Target" && <Target className="h-3.5 w-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "Activity" && <Activity className="h-3.5 w-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "TrendingUp" && <TrendingUp className="h-3.5 w-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "BarChart3" && <BarChart3 className="h-3.5 w-3.5 text-fg-5" strokeWidth={1.75} />}
              {m.icon === "Wallet" && <Wallet className="h-3.5 w-3.5 text-fg-5" strokeWidth={1.75} />}
            </div>
            <p className="mt-3 text-xl font-semibold text-fg-1">{m.value}</p>
            <p className="mt-1 text-[11px] text-fg-4">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="overflow-hidden surface-card lg:col-span-3">
          <div className="border-b border-line-soft px-6 py-4">
            <h2 className="text-sm font-semibold text-fg-2">Monthly Returns</h2>
            <p className="mt-0.5 text-[11px] text-fg-4">Cumulative return by month</p>
          </div>
          <div className="px-2 py-4">
            {hasReturns ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyReturns} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gain)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--gain)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-soft)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--fg-4)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--fg-4)" }} tickFormatter={(v: number) => `${v}%`} width={40} />
                  <Tooltip contentStyle={{ background: "var(--raised)", border: "1px solid var(--line-strong)", borderRadius: "8px", fontSize: "12px", color: "var(--fg-1)" }} />
                  <Area type="monotone" dataKey="return" stroke="var(--gain)" strokeWidth={2} fill="url(#gradReturn)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-70 items-center justify-center px-6 text-center">
                <p className="text-[12px] text-fg-4">Not enough history yet - monthly returns will appear once you have transactions across multiple months.</p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden surface-card lg:col-span-2">
          <div className="border-b border-line-soft px-6 py-4">
            <h2 className="text-sm font-semibold text-fg-2">Asset Allocation</h2>
            <p className="mt-0.5 text-[11px] text-fg-4">Portfolio distribution by asset</p>
          </div>
          {hasSectors ? (
            <div className="flex flex-col items-center gap-4 px-6 py-4 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sectorAllocation} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {sectorAllocation.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-1/2">
                {sectorAllocation.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* We now use StockLogo because s.name is actually the ticker! */}
                      <StockLogo ticker={s.name} size={18} />
                      <span className="text-[11px] font-medium text-fg-3">{s.name.replace(".JK", "")}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-fg-2">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-50 items-center justify-center px-6 py-4 text-center">
              <p className="text-[12px] text-fg-4">Asset breakdown isn&apos;t available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}