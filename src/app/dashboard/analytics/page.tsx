import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

const monthlyReturns: any[] = [];

const sectorAllocation: any[] = [];

const metrics = [
  { label: "Sharpe Ratio", value: "0.00", icon: "Target", detail: "Risk-adjusted return" },
  { label: "Max Drawdown", value: "0.00%", icon: "Activity", detail: "Peak to trough" },
  { label: "Win Rate", value: "0.0%", icon: "TrendingUp", detail: "Profitable trades" },
  { label: "Avg Return", value: "0.00%", icon: "BarChart3", detail: "Monthly average" },
];

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">Analytics</h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">Performance metrics and portfolio analytics.</p>
      </div>

      <AnalyticsCharts 
        monthlyReturns={monthlyReturns} 
        sectorAllocation={sectorAllocation} 
        metrics={metrics} 
      />
    </div>
  );
}
