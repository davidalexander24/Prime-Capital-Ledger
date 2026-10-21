import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getPortfolioHoldings } from "@/app/actions/portfolio";
import { getCachedUsdIdrRate, getUserBaseCurrency } from "@/lib/requestData";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = session.user.id;

  const [res, fxRate, baseCurrency] = await Promise.all([
    getPortfolioHoldings(),
    getCachedUsdIdrRate(),
    getUserBaseCurrency(userId),
  ]);
  const holdings = res.success && res.data?.holdings ? res.data.holdings : [];


  const rate = fxRate ?? 16000;

  let totalMarketValueConverted = 0;
  let totalCostConverted = 0;
  for (const h of holdings) {
    if (baseCurrency === "USD") {
      totalMarketValueConverted += h.currency === "IDR" ? h.marketValue / rate : h.marketValue;
      totalCostConverted += h.currency === "IDR" ? h.costBasis / rate : h.costBasis;
    } else {
      totalMarketValueConverted += h.currency === "USD" ? h.marketValue * rate : h.marketValue;
      totalCostConverted += h.currency === "USD" ? h.costBasis * rate : h.costBasis;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
          Portfolio
        </h1>
        <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">
          Current holdings and position breakdown.
        </p>
      </div>

      <PortfolioSummary
        totalMarketValue={totalMarketValueConverted}
        totalCost={totalCostConverted}
        baseCurrency={baseCurrency}
        rate={rate}
      />

      <HoldingsTable holdings={holdings} />
    </div>
  );
}
