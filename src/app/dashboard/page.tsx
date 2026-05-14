import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ValuationChart } from "@/components/charts/valuation-chart";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { TopTraded } from "@/components/dashboard/top-traded";
import {
  getPortfolioSummary,
  getHistoricalValuations,
  getRecentTransactions,
  getTrendingStocks,
} from "@/app/actions/dashboard";
import {
  portfolioSummary as dummySummary,
  portfolioValuation as dummyValuation,
  transactions as dummyTransactions,
  topTradedAssets as dummyTopTraded,
} from "@/lib/dummy-data";

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "";

export default async function DashboardPage() {
  // Fetch all data in parallel — fall back to dummy data on failure
  const [summaryRes, valuationRes, transactionsRes, trendingRes] =
    await Promise.all([
      DEFAULT_USER_ID
        ? getPortfolioSummary(DEFAULT_USER_ID)
        : Promise.resolve({ success: false, data: null, error: null }),
      DEFAULT_USER_ID
        ? getHistoricalValuations(DEFAULT_USER_ID)
        : Promise.resolve({ success: false, data: null, error: null }),
      DEFAULT_USER_ID
        ? getRecentTransactions(DEFAULT_USER_ID)
        : Promise.resolve({ success: false, data: null, error: null }),
      getTrendingStocks().catch(() => ({
        success: false as const,
        data: null,
        error: null,
      })),
    ]);

  const summary = summaryRes.success && summaryRes.data ? summaryRes.data : dummySummary;
  const valuation = valuationRes.success && valuationRes.data?.length ? valuationRes.data : dummyValuation;
  const transactions = transactionsRes.success && transactionsRes.data?.length ? transactionsRes.data : dummyTransactions;
  const trending = trendingRes.success && trendingRes.data?.length ? trendingRes.data : dummyTopTraded;

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

      <SummaryCards data={summary} />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <ValuationChart data={valuation} />
        </div>
        <div className="col-span-2">
          <TopTraded data={trending} />
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}
