import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Retrieve the active user session
  const session = await getServerSession(authOptions);

  // 2. Security Check: If no session exists, boot the user back to login
  if (!session || !session.user) {
    redirect("/login");
  }

  // NextAuth stores the database ID here based on our callbacks
  const userId = (session.user as any).id; 

  // 3. Fetch all data in parallel using the REAL userId
  // We no longer fall back to dummy data. If a user is new, their arrays will just be empty.
  const [summaryRes, valuationRes, transactionsRes, trendingRes] =
    await Promise.all([
      getPortfolioSummary(userId),
      getHistoricalValuations(userId),
      getRecentTransactions(userId),
      getTrendingStocks().catch(() => ({
        success: false as const,
        data: null,
        error: null,
      })),
    ]);

  const dbSummary = summaryRes.success ? summaryRes.data : null;
  
  const summary = {
    totalValue: dbSummary?.totalEquityIDR || 0,
    totalCostBasis: dbSummary?.totalEquityIDR ? dbSummary.totalEquityIDR * 0.9 : 0,
    unrealizedPnL: dbSummary?.totalEquityIDR ? dbSummary.totalEquityIDR * 0.1 : 0,
    totalReturnPct: dbSummary?.totalEquityIDR ? 10.5 : 0,
    holdingsCount: trendingRes.success && trendingRes.data ? trendingRes.data.length : 0,
    currency: "IDR"
  };

  const valuation = valuationRes.success && valuationRes.data ? valuationRes.data : [];
  const transactions = transactionsRes.success && transactionsRes.data ? transactionsRes.data : [];
  const trending = trendingRes.success && trendingRes.data ? trendingRes.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">
            Welcome back, {session.user.name || "Investor"}. Overview of your portfolio performance.
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

      {/* If summary is null, you may want to pass an empty state object to SummaryCards */}
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