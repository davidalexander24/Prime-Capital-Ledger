import { cache } from "react";
import prisma from "@/lib/prisma";
import { getUsdIdrRate, getMarketQuotes } from "@/lib/marketData";

// Request-scoped memoization. React's cache() dedupes these across every
// server function invoked during a single page render, so the dashboard's
// parallel actions share one DB query / FX read / quote batch instead of
// repeating them. Only valid for server-side use within a render pass.

// Full transaction ledger with asset relation, ordered oldest-first.
// Shared by getPortfolioHoldings, getHistoricalValuations, getHoldingsDailyChange.
export const getLedger = cache(async (userId: string) => {
  return prisma.transaction.findMany({
    where: { userId },
    include: { asset: true },
    orderBy: { date: "asc" },
  });
});

// User's base currency, defaulting to IDR.
export const getUserBaseCurrency = cache(async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });
  return user?.baseCurrency || "IDR";
});

// USD/IDR FX rate, deduped to one Redis read per request.
export const getCachedUsdIdrRate = cache(async () => {
  return getUsdIdrRate();
});

// Live quotes (price + daily change) for every ticker in the user's ledger,
// in a single batched mget/pipeline. Serves all current-price consumers.
export const getCurrentQuotesForUser = cache(async (userId: string) => {
  const transactions = await getLedger(userId);
  const tickers = Array.from(
    new Set(
      transactions
        .filter((t) => t.asset && t.assetId)
        .map((t) => t.asset!.ticker)
    )
  );
  return getMarketQuotes(tickers);
});
