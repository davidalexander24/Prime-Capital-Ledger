"use server";

import prisma from '@/lib/prisma';
import {
  getUsdIdrRate,
  getMarketQuote,
  getHistoricalPrices,
} from '@/lib/marketData';
import type { PortfolioValuationPoint, TransactionRecord } from '@/lib/types';
type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

// Portfolio Summary
export async function getPortfolioSummary(userId: string): Promise<ActionResponse<any>> {
  try {
    const latestValuation = await prisma.dailyValuation.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }, // Get the newest entry
    });

    if (!latestValuation) {
      return { success: true, data: null, error: "No valuation data found for this user." };
    }

    // Convert Decimals to native Numbers
    const serializedData = {
      ...latestValuation,
      cashBalanceUSD: Number(latestValuation.cashBalanceUSD),
      marketValueUSD: Number(latestValuation.marketValueUSD),
      totalEquityUSD: Number(latestValuation.totalEquityUSD),
      totalEquityIDR: Number(latestValuation.totalEquityIDR),
      exchangeRate: Number(latestValuation.exchangeRate),
      date: latestValuation.date.toISOString()
    };

    return { success: true, data: serializedData, error: null };
  } catch (error) {
    console.error("Error fetching portfolio summary:", error);
    return { success: false, data: null, error: "Failed to retrieve portfolio summary." };
  }
}

// Historical Valuation Timeline
export async function getHistoricalValuations(
  userId: string
): Promise<ActionResponse<PortfolioValuationPoint[]>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        asset: {
          select: { id: true, ticker: true, currency: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (!transactions.length) {
      return { success: true, data: [], error: null };
    }

    const startDate = new Date(Date.UTC(
      transactions[0].date.getUTCFullYear(),
      transactions[0].date.getUTCMonth(),
      transactions[0].date.getUTCDate()
    ));
    const endDate = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    ));

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

    const fxByDate = new Map<string, number>();
    for (const point of fxHistory || []) {
      fxByDate.set(point.date, point.close);
    }

    const fallbackFx = (await getUsdIdrRate()) ?? 16000;

    const txByDate = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const dateKey = tx.date.toISOString().split('T')[0];
      const list = txByDate.get(dateKey);
      if (list) {
        list.push(tx);
      } else {
        txByDate.set(dateKey, [tx]);
      }
    }

    const holdings = new Map<string, {
      ticker: string;
      currency: string;
      shares: number;
      totalCost: number;
    }>();

    let cashUSD = 0;
    let contributionsUSD = 0;
    let lastFx = fxHistory?.[0]?.close ?? fallbackFx;
    let previousMarketValue = 0;

    const valuationSeries: PortfolioValuationPoint[] = [];

    for (
      let cursor = new Date(startDate);
      cursor <= endDate;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const dateKey = cursor.toISOString().split('T')[0];
      const dayTransactions = txByDate.get(dateKey) ?? [];

      for (const tx of dayTransactions) {
        const qty = Number(tx.quantity);
        const price = Number(tx.executionPrice);
        const fee = Number(tx.fee);
        const grossValue = qty * price;

        if (tx.type === "DEPOSIT") {
          cashUSD += grossValue;
          contributionsUSD += grossValue;
          continue;
        }

        if (tx.type === "WITHDRAW") {
          cashUSD -= grossValue;
          contributionsUSD -= grossValue;
          continue;
        }

        if (!tx.assetId || !tx.asset) {
          continue;
        }

        const meta = assetMeta.get(tx.assetId);
        if (!meta) {
          continue;
        }

        const holding = holdings.get(tx.assetId) ?? {
          ticker: meta.ticker,
          currency: meta.currency,
          shares: 0,
          totalCost: 0,
        };

        if (tx.type === "BUY") {
          const cost = grossValue + fee;
          holding.shares += qty;
          holding.totalCost += cost;
          cashUSD -= cost;
        } else if (tx.type === "SELL") {
          const proceeds = grossValue - fee;
          const avgCost = holding.shares > 0 ? holding.totalCost / holding.shares : 0;
          holding.shares -= qty;
          holding.totalCost -= avgCost * qty;
          cashUSD += proceeds;
        }

        holdings.set(tx.assetId, holding);
      }

      if (fxByDate.has(dateKey)) {
        lastFx = fxByDate.get(dateKey) ?? lastFx;
      }

      let marketValueUSD = 0;
      let marketValueIDR = 0;

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
        } else {
          marketValueUSD += positionValue;
        }
      }

      const totalMarketValue = (marketValueUSD + cashUSD) * lastFx + marketValueIDR;
      const totalCostBasis = contributionsUSD * lastFx;
      const unrealizedPnL = totalMarketValue - totalCostBasis;
      const dailyReturn =
        previousMarketValue === 0
          ? 0
          : (totalMarketValue - previousMarketValue) / previousMarketValue;

      previousMarketValue = totalMarketValue;

      valuationSeries.push({
        date: dateKey,
        totalMarketValue,
        totalCostBasis,
        unrealizedPnL,
        dailyReturn,
      });
    }

    return { success: true, data: valuationSeries, error: null };
  } catch (error) {
    console.error("Error fetching historical valuations:", error);
    return { success: false, data: null, error: "Failed to retrieve valuation history." };
  }
}

// 10 Most Recent Ledger Entries
export async function getRecentTransactions(
  userId: string
): Promise<ActionResponse<TransactionRecord[]>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        asset: {
          select: { ticker: true, companyName: true, currency: true }
        }
      }
    });

    const serializedData: TransactionRecord[] = transactions.map((t) => {
      const qty = Number(t.quantity);
      const price = Number(t.executionPrice);
      const fee = Number(t.fee);
      const grossValue = qty * price;

      let netValue = grossValue;
      if (t.type === "BUY") {
        netValue = grossValue + fee;
      } else if (t.type === "SELL") {
        netValue = grossValue - fee;
      } else if (t.type === "WITHDRAW") {
        netValue = -grossValue;
      }

      return {
        id: t.id,
        executedAt: t.date.toISOString(),
        ticker: t.asset?.ticker ?? t.type,
        assetName: t.asset?.companyName ?? t.type,
        type: t.type as TransactionRecord["type"],
        quantity: qty,
        lotSize: 100,
        pricePerShare: price,
        grossValue,
        totalFees: fee,
        netValue,
        currency: t.asset?.currency ?? "USD",
        source: "MANUAL" as const,
      };
    });

    return { success: true, data: serializedData, error: null };
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return { success: false, data: null, error: "Failed to retrieve transaction history." };
  }
}

// 5 Most Traded Stocks
export async function getTrendingStocks(): Promise<ActionResponse<any>> {
  try {
    const topTraded = await prisma.transaction.groupBy({
      by: ['assetId'],
      where: {
        assetId: { not: null }, 
      },
      _count: {
        assetId: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          assetId: 'desc',
        },
      },
      take: 5,
    });

    const assetIds = topTraded.map(t => t.assetId as string);

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
    });

    // Use Promise.all to map over the array and fetch live prices concurrently
    const trendingData = await Promise.all(topTraded.map(async (trade) => {
      const assetDetails = assets.find(a => a.id === trade.assetId);
      const ticker = assetDetails?.ticker || "Unknown";
      const currency = assetDetails?.currency ?? "USD";
      
      let lastPrice = 0;
      let changePercent = 0;

      if (ticker !== "Unknown") {
        // Use our new UI-specific quote fetcher
        const quote = await getMarketQuote(ticker);
        if (quote) {
          lastPrice = quote.price;
          changePercent = quote.changePercent;
        }
      }

      return {
        ticker,
        name: assetDetails?.companyName || "Unknown",
        sector: "TECH", // Fallback sector
        totalVolume: Number(trade._sum.quantity) || 0,
        tradeCount: trade._count.assetId,
        lastPrice,
        changePercent,
        currency
      };
    }));
    
    return { success: true, data: trendingData, error: null };
  } catch (error) {
    console.error("Error calculating trending stocks:", error);
    return { success: false, data: null, error: "Failed to calculate trending assets." };
  }
}