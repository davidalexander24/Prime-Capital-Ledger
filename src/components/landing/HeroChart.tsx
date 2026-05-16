"use client"

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const mockData = [
  { month: "Jan", value: 100000 },
  { month: "Feb", value: 112000 },
  { month: "Mar", value: 108000 },
  { month: "Apr", value: 125000 },
  { month: "May", value: 138000 },
  { month: "Jun", value: 132000 },
  { month: "Jul", value: 151000 },
  { month: "Aug", value: 168000 },
  { month: "Sep", value: 162000 },
  { month: "Oct", value: 179000 },
  { month: "Nov", value: 191000 },
  { month: "Dec", value: 208000 },
]

export function HeroChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={mockData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.70 0.08 230)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="oklch(0.70 0.08 230)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "oklch(0.45 0.01 260)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.07 0.005 260)",
            border: "1px solid oklch(0.16 0.005 260)",
            borderRadius: "0.5rem",
            fontSize: "12px",
            color: "oklch(0.93 0.005 260)",
          }}
          formatter={(value) => [
            `$${(Number(value) / 1000).toFixed(0)}k`,
            "Portfolio",
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="oklch(0.70 0.08 230)"
          strokeWidth={2}
          fill="url(#heroGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.70 0.08 230)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
