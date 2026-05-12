import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ValuationChart } from "@/components/charts/valuation-chart";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { TopTraded } from "@/components/dashboard/top-traded";
import {
  portfolioSummary,
  portfolioValuation,
  transactions,
  topTradedAssets,
} from "@/lib/dummy-data";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">
            Overview of your portfolio performance and recent activity.
          </p>
        </div>
        <span className="text-[11px] text-[oklch(0.35_0.01_260)]">
          Last updated: {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <SummaryCards data={portfolioSummary} />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <ValuationChart data={portfolioValuation} />
        </div>
        <div className="col-span-2">
          <TopTraded data={topTradedAssets} />
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}
