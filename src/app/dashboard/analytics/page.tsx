"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Activity, Target } from "lucide-react";

const monthlyReturns = [
  { month: "Jan", return: 4.96 },
  { month: "Feb", return: 3.43 },
  { month: "Mar", return: 5.78 },
  { month: "Apr", return: 4.12 },
  { month: "May", return: 3.62 },
  { month: "Jun", return: 5.14 },
  { month: "Jul", return: 2.20 },
];

const sectorAllocation = [
  { name: "Financials", value: 54.2, color: "oklch(0.65 0.01 260)" },
  { name: "Telecom", value: 16.9, color: "oklch(0.50 0.01 260)" },
  { name: "Industrials", value: 11.0, color: "oklch(0.38 0.01 260)" },
  { name: "Consumer Staples", value: 12.3, color: "oklch(0.28 0.01 260)" },
  { name: "Technology", value: 5.6, color: "oklch(0.20 0.01 260)" },
];

const metrics = [
  { label: "Sharpe Ratio", value: "1.42", icon: Target, detail: "Risk-adjusted return" },
  { label: "Max Drawdown", value: "-3.12%", icon: Activity, detail: "Peak to trough" },
  { label: "Win Rate", value: "72.4%", icon: TrendingUp, detail: "Profitable trades" },
  { label: "Avg Return", value: "+4.18%", icon: BarChart3, detail: "Monthly average" },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">Analytics</h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">Performance metrics and portfolio analytics.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">{m.label}</span>
              <m.icon className="h-4 w-4 text-[oklch(0.35_0.01_260)]" strokeWidth={1.75} />
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
          </div>
        </div>

        <div className="col-span-2 overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
          <div className="border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">Sector Allocation</h2>
            <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">Portfolio distribution by sector</p>
          </div>
          <div className="flex items-center px-6 py-4">
            <div className="w-1/2">
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
            <div className="flex w-1/2 flex-col gap-2.5">
              {sectorAllocation.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[11px] text-[oklch(0.65_0.005_260)]">{s.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[oklch(0.80_0.005_260)]">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
