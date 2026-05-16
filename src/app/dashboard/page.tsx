import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ValuationChart } from "@/components/charts/valuation-chart";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { TopTraded } from "@/components/dashboard/top-traded";
import {
  getHistoricalValuations,
  getRecentTransactions,
  getHoldingsDailyChange,
} from "@/app/actions/dashboard";
import { getPortfolioHoldings } from "@/app/actions/portfolio";
import { getUsdIdrRate } from "@/lib/marketData";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [valuationRes, transactionsRes, moversRes, holdingsRes, fxRate] =
    await Promise.all([
      getHistoricalValuations(userId),
      getRecentTransactions(userId),
      getHoldingsDailyChange(userId).catch(() => ({
        success: false as const,
        data: null,
        error: null,
      })),
      getPortfolioHoldings(userId),
      getUsdIdrRate(),
    ]);

  const valuation = valuationRes.success && valuationRes.data ? valuationRes.data : [];
  const transactions = transactionsRes.success && transactionsRes.data ? transactionsRes.data : [];
  const movers = moversRes.success && moversRes.data ? moversRes.data : [];
  const holdings = holdingsRes.success && holdingsRes.data ? holdingsRes.data.holdings : [];
  const rate = fxRate ?? 16000;

  // Compute totals in IDR, converting USD positions via FX
  let totalMarketValueIDR = 0;
  let totalCostBasisIDR = 0;
  for (const h of holdings) {
    if (h.currency === "IDR") {
      totalMarketValueIDR += h.marketValue;
      totalCostBasisIDR += h.costBasis;
    } else {
      totalMarketValueIDR += h.marketValue * rate;
      totalCostBasisIDR += h.costBasis * rate;
    }
  }
  const unrealizedPnLIDR = totalMarketValueIDR - totalCostBasisIDR;
  const totalReturnPct =
    totalCostBasisIDR > 0 ? (unrealizedPnLIDR / totalCostBasisIDR) * 100 : 0;

  const summary = {
    totalValue: totalMarketValueIDR,
    totalCostBasis: totalCostBasisIDR,
    unrealizedPnL: unrealizedPnLIDR,
    totalReturnPct,
    holdingsCount: holdings.length,
    currency: "IDR",
  };

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

      <SummaryCards data={summary} />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <ValuationChart data={valuation} />
        </div>
        <div className="col-span-2">
          <TopTraded data={movers} />
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}