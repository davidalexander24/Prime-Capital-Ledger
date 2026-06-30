import { cache } from "react";
import { getHistoricalPrices } from "@/lib/marketData";
import { redis } from "@/lib/redis";
import { getLedger, getUserBaseCurrency, getCachedUsdIdrRate } from "@/lib/requestData";
import type { PortfolioValuationPoint } from "@/lib/types";

const TIMELINE_CACHE_TTL = 60 * 60 * 12; // 12 hours

export interface PortfolioTimeline {
  baseCurrency: string;
  fxRate: number;
  // Per-day valuation series (includes a seed zero-day before the first trade).
  // The final point is pre-live-override; callers apply live prices on top.
  valuationSeries: PortfolioValuationPoint[];
  // Per-month first/last market value, in calendar order.
  monthlyValues: { monthKey: string; start: number; end: number }[];
  dailyReturns: number[];
  maxDrawdown: number;
  realizedByCurrency: Record<string, number>;
  // Holdings still open at the end of the series.
  finalHoldings: { ticker: string; currency: string; shares: number; totalCost: number }[];
  // Last seen historical close per ticker (fallback when a live quote is missing).
  lastPriceByTicker: Record<string, number>;
}

type LedgerTransaction = Awaited<ReturnType<typeof getLedger>>[number];

// Cheap content hash so the cache key changes whenever the ledger is edited
// (adds, deletes, and in-place split mutations to quantity/price).
function ledgerSignature(transactions: LedgerTransaction[]): string {
  let h = 2166136261; // FNV-1a 32-bit
  for (const t of transactions) {
    const s = `${t.id}:${t.type}:${t.quantity.toString()}:${t.executionPrice.toString()}:${t.date.toISOString()}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return `${(h >>> 0).toString(36)}.${transactions.length}`;
}

// Heavy day-by-day portfolio reconstruction shared by the dashboard valuation
// chart and the analytics page. Memoized in Redis: the historical portion only
// changes when the ledger is edited or the calendar day rolls over, so the
// O(days x holdings) loop and per-ticker history fetches are skipped on a hit.
export const buildPortfolioTimeline = cache(
  async (userId: string): Promise<PortfolioTimeline> => {
    const transactions = await getLedger(userId);
    const baseCurrency = await getUserBaseCurrency(userId);

    const empty: PortfolioTimeline = {
      baseCurrency,
      fxRate: 16000,
      valuationSeries: [],
      monthlyValues: [],
      dailyReturns: [],
      maxDrawdown: 0,
      realizedByCurrency: {},
      finalHoldings: [],
      lastPriceByTicker: {},
    };

    if (!transactions.length) return empty;

    const todayKey = new Date().toISOString().split("T")[0];
    const sig = ledgerSignature(transactions);
    const cacheKey = `timeline:${userId}:${baseCurrency}:${todayKey}:${sig}`;

    try {
      const cached = await redis.get<PortfolioTimeline>(cacheKey);
      if (cached) {
        console.log(`[TIMELINE HIT] ${userId}`);
        return cached;
      }
    } catch (error) {
      console.warn(`[CACHE WARNING] timeline read failed for ${userId}:`, error);
    }

    const startDate = new Date(
      Date.UTC(
        transactions[0].date.getUTCFullYear(),
        transactions[0].date.getUTCMonth(),
        transactions[0].date.getUTCDate()
      )
    );
    const endDate = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      )
    );

    const tickerSet = new Set<string>();
    const assetMeta = new Map<string, { ticker: string; currency: string }>();
    for (const tx of transactions) {
      if (tx.asset && tx.assetId) {
        tickerSet.add(tx.asset.ticker);
        assetMeta.set(tx.assetId, {
          ticker: tx.asset.ticker,
          currency: tx.asset.currency ?? "USD",
        });
      }
    }

    const tickers = Array.from(tickerSet);
    const [fxHistory, ...priceHistories] = await Promise.all([
      getHistoricalPrices("USDIDR=X", startDate, endDate),
      ...tickers.map((ticker) => getHistoricalPrices(ticker, startDate, endDate)),
    ]);

    const priceByTickerDate = new Map<string, Map<string, number>>();
    const lastPriceByTicker = new Map<string, number>();
    tickers.forEach((ticker, index) => {
      const series = priceHistories[index] || [];
      const byDate = new Map<string, number>();
      for (const point of series) {
        byDate.set(point.date, point.close);
      }
      priceByTickerDate.set(ticker, byDate);
      if (series.length) {
        lastPriceByTicker.set(ticker, series[0].close);
      }
    });

    const fxRate =
      (await getCachedUsdIdrRate()) ??
      fxHistory?.[fxHistory.length - 1]?.close ??
      16000;

    const txByDate = new Map<string, LedgerTransaction[]>();
    for (const tx of transactions) {
      const dateKey = tx.date.toISOString().split("T")[0];
      const list = txByDate.get(dateKey);
      if (list) list.push(tx);
      else txByDate.set(dateKey, [tx]);
    }

    const holdings = new Map<
      string,
      { ticker: string; currency: string; shares: number; totalCost: number }
    >();
    const realizedByCurrency: Record<string, number> = {};
    const monthly = new Map<string, { start: number; end: number }>();
    const monthOrder: string[] = [];
    const dailyReturns: number[] = [];
    let peakValue = 0;
    let maxDrawdown = 0;
    let previousMarketValue = 0;

    const valuationSeries: PortfolioValuationPoint[] = [];

    // zero-day before the first transaction
    const seedDate = new Date(startDate);
    seedDate.setUTCDate(seedDate.getUTCDate() - 1);
    valuationSeries.push({
      date: seedDate.toISOString().split("T")[0],
      totalMarketValue: 0,
      totalCostBasis: 0,
      unrealizedPnL: 0,
      dailyReturn: 0,
    });

    for (
      let cursor = new Date(startDate);
      cursor <= endDate;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const dateKey = cursor.toISOString().split("T")[0];
      const dayTransactions = txByDate.get(dateKey) ?? [];

      for (const tx of dayTransactions) {
        if (tx.type === "DEPOSIT" || tx.type === "WITHDRAW") continue;
        if (!tx.assetId || !tx.asset) continue;

        const meta = assetMeta.get(tx.assetId);
        if (!meta) continue;

        const qty = Number(tx.quantity);
        const price = Number(tx.executionPrice);
        const fee = Number(tx.fee);
        const grossValue = qty * price;

        const holding = holdings.get(tx.assetId) ?? {
          ticker: meta.ticker,
          currency: meta.currency,
          shares: 0,
          totalCost: 0,
        };

        if (tx.type === "BUY") {
          holding.shares = Math.round((holding.shares + qty) * 1e8) / 1e8;
          holding.totalCost += grossValue + fee;
        } else if (tx.type === "SELL") {
          const avgCost = holding.shares !== 0 ? holding.totalCost / holding.shares : 0;
          realizedByCurrency[meta.currency] =
            (realizedByCurrency[meta.currency] ?? 0) + (grossValue - fee) - avgCost * qty;
          holding.shares = Math.round((holding.shares - qty) * 1e8) / 1e8;
          if (holding.shares < 0) holding.shares = 0;
          holding.totalCost -= avgCost * qty;
          if (holding.shares === 0) holding.totalCost = 0;
        }

        holdings.set(tx.assetId, holding);
      }

      let marketValueUSD = 0;
      let marketValueIDR = 0;
      let costBasisUSD = 0;
      let costBasisIDR = 0;

      for (const holding of holdings.values()) {
        if (holding.shares <= 0) continue;
        const priceMap = priceByTickerDate.get(holding.ticker);
        let lastPrice = lastPriceByTicker.get(holding.ticker) ?? 0;
        if (priceMap?.has(dateKey)) {
          lastPrice = priceMap.get(dateKey) ?? lastPrice;
          lastPriceByTicker.set(holding.ticker, lastPrice);
        }
        const positionValue = holding.shares * lastPrice;
        if (holding.currency === "IDR") {
          marketValueIDR += positionValue;
          costBasisIDR += holding.totalCost;
        } else {
          marketValueUSD += positionValue;
          costBasisUSD += holding.totalCost;
        }
      }

      const totalMarketValue =
        baseCurrency === "USD"
          ? marketValueUSD + marketValueIDR / fxRate
          : marketValueUSD * fxRate + marketValueIDR;
      const totalCostBasis =
        baseCurrency === "USD"
          ? costBasisUSD + costBasisIDR / fxRate
          : costBasisUSD * fxRate + costBasisIDR;
      const unrealizedPnL = totalMarketValue - totalCostBasis;
      const dailyReturn =
        previousMarketValue === 0
          ? 0
          : (totalMarketValue - previousMarketValue) / previousMarketValue;

      // analytics daily returns (only when both endpoints positive)
      if (previousMarketValue > 0 && totalMarketValue > 0) {
        dailyReturns.push((totalMarketValue - previousMarketValue) / previousMarketValue);
      }

      // max drawdown
      if (totalMarketValue > peakValue) peakValue = totalMarketValue;
      if (peakValue > 0) {
        const drawdown = (peakValue - totalMarketValue) / peakValue;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      previousMarketValue = totalMarketValue;

      valuationSeries.push({
        date: dateKey,
        totalMarketValue,
        totalCostBasis,
        unrealizedPnL,
        dailyReturn,
      });

      // monthly first/last value
      const monthKey = dateKey.substring(0, 7);
      const existing = monthly.get(monthKey);
      if (!existing) {
        monthly.set(monthKey, { start: totalMarketValue, end: totalMarketValue });
        monthOrder.push(monthKey);
      } else {
        existing.end = totalMarketValue;
      }
    }

    const timeline: PortfolioTimeline = {
      baseCurrency,
      fxRate,
      valuationSeries,
      monthlyValues: monthOrder.map((monthKey) => ({
        monthKey,
        start: monthly.get(monthKey)!.start,
        end: monthly.get(monthKey)!.end,
      })),
      dailyReturns,
      maxDrawdown,
      realizedByCurrency,
      finalHoldings: Array.from(holdings.values()).filter((h) => h.shares > 0),
      lastPriceByTicker: Object.fromEntries(lastPriceByTicker),
    };

    try {
      await redis.set(cacheKey, timeline, { ex: TIMELINE_CACHE_TTL });
      console.log(`[TIMELINE MISS] cached ${userId}`);
    } catch (error) {
      console.warn(`[CACHE WARNING] timeline write failed for ${userId}:`, error);
    }

    return timeline;
  }
);
