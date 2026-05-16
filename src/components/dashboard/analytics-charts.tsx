"use client";

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from "recharts";
import { 
  BarChart3, TrendingUp, Activity, Target
} from "lucide-react";
import { StockLogo } from "@/components/ui/stock-logo";

export function AnalyticsCharts({ monthlyReturns, sectorAllocation, metrics }: any) {
  const hasReturns = monthlyReturns?.length > 0;
  const hasSectors = sectorAllocation?.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m: any) => (
          <div key={m.label} className="rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">{m.label}</span>
              {m.icon === "Target" && <Target className="h-3.5 w-3.5 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />}
              {m.icon === "Activity" && <Activity className="h-3.5 w-3.5 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />}
              {m.icon === "TrendingUp" && <TrendingUp className="h-3.5 w-3.5 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />}
              {m.icon === "BarChart3" && <BarChart3 className="h-3.5 w-3.5 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />}
            </div>
            <p className="mt-3 text-xl font-semibold text-[oklch(0.93_0.005_260)]">{m.value}</p>
            <p className="mt-1 text-[11px] text-[oklch(0.40_0.01_260)]">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
          <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">Monthly Returns</h2>
            <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">Cumulative return by month</p>
          </div>
          <div className="px-2 py-4">
            {hasReturns ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyReturns} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.15 155)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="oklch(0.65 0.15 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.12 0.005 260)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.40 0.01 260)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.40 0.01 260)" }} tickFormatter={(v: number) => `${v}%`} width={40} />
                  <Tooltip contentStyle={{ background: "oklch(0.06 0.005 260)", border: "1px solid oklch(0.18 0.005 260)", borderRadius: "8px", fontSize: "12px", color: "oklch(0.90 0.005 260)" }} />
                  <Area type="monotone" dataKey="return" stroke="oklch(0.65 0.15 155)" strokeWidth={2} fill="url(#gradReturn)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center px-6 text-center">
                <p className="text-[12px] text-[oklch(0.45_0.01_260)]">Not enough history yet — monthly returns will appear once you have transactions across multiple months.</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
          <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">Asset Allocation</h2>
            <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">Portfolio distribution by asset</p>
          </div>
          {hasSectors ? (
            <div className="flex items-center px-6 py-4">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sectorAllocation} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {sectorAllocation.map((entry: any) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-1/2 flex-col gap-3">
                {sectorAllocation.map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* We now use StockLogo because s.name is actually the ticker! */}
                      <StockLogo ticker={s.name} size={18} />
                      <span className="text-[11px] font-medium text-[oklch(0.70_0.005_260)]">{s.name.replace(".JK", "")}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[oklch(0.85_0.005_260)]">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center px-6 py-4 text-center">
              <p className="text-[12px] text-[oklch(0.45_0.01_260)]">Asset breakdown isn&apos;t available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}