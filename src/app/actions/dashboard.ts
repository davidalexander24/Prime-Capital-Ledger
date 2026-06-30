"use server";

import prisma from '@/lib/prisma';
import { getMarketQuote } from '@/lib/marketData';
import { getLedger, getCurrentQuotesForUser } from '@/lib/requestData';
import { buildPortfolioTimeline } from '@/lib/timeline';
import type { PortfolioValuationPoint, TransactionRecord } from '@/lib/types';
type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

interface PortfolioSummaryData {
  cashBalanceUSD: number;
  marketValueUSD: number;
  totalEquityUSD: number;
  totalEquityIDR: number;
  exchangeRate: number;
  date: string;
}

interface HoldingDailyChange {
  ticker: string;
  name: string;
  sector: string;
  totalVolume: number;
  tradeCount: number;
  lastPrice: number;
  changePercent: number;
  currency: string;
}

interface TrendingStock {
  ticker: string;
  name: string;
  sector: string;
  totalVolume: number;
  tradeCount: number;
  lastPrice: number;
  changePercent: number;
  currency: string;
}

// Portfolio Summary
export async function getPortfolioSummary(userId: string): Promise<ActionResponse<PortfolioSummaryData>> {
  try {
    const latestValuation = await prisma.dailyValuation.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }, // Get the newest entry
    });

    if (!latestValuation) {
      return { success: true, data: null, error: "No valuation data found for this user." };
    }

    // Convert Decimals to native Numbers
    const serializedData: PortfolioSummaryData = {
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
    const timeline = await buildPortfolioTimeline(userId);
    const { valuationSeries, finalHoldings, lastPriceByTicker, fxRate, baseCurrency } =
      timeline;

    if (!valuationSeries.length) {
      return { success: true, data: [], error: null };
    }

    // Override the final point with live prices (the only real-time part).
    const lastPoint = valuationSeries[valuationSeries.length - 1];
    if (lastPoint && finalHoldings.length > 0) {
      const quotes = await getCurrentQuotesForUser(userId);
      let liveMvUSD = 0;
      let liveMvIDR = 0;
      for (const holding of finalHoldings) {
        const price =
          quotes.get(holding.ticker)?.price ??
          lastPriceByTicker[holding.ticker] ??
          0;
        const positionValue = holding.shares * price;
        if (holding.currency === "IDR") liveMvIDR += positionValue;
        else liveMvUSD += positionValue;
      }
      const liveTotalMarketValue =
        baseCurrency === "USD"
          ? liveMvUSD + liveMvIDR / fxRate
          : liveMvUSD * fxRate + liveMvIDR;
      lastPoint.totalMarketValue = liveTotalMarketValue;
      lastPoint.unrealizedPnL = liveTotalMarketValue - lastPoint.totalCostBasis;
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

// Daily price change for the stocks the user actually owns.
// Sorted by largest absolute % move first (biggest movers today).
export async function getHoldingsDailyChange(
  userId: string
): Promise<ActionResponse<HoldingDailyChange[]>> {
  try {
    const transactions = await getLedger(userId);

    const holdings = new Map<
      string,
      {
        ticker: string;
        name: string;
        currency: string;
        shares: number;
        tradeCount: number;
      }
    >();

    for (const t of transactions) {
      if (!t.asset || !t.assetId) continue;
      if (t.type !== "BUY" && t.type !== "SELL") continue;

      const qty = Number(t.quantity);
      const holding = holdings.get(t.assetId) ?? {
        ticker: t.asset.ticker,
        name: t.asset.companyName,
        currency: t.asset.currency ?? "USD",
        shares: 0,
        tradeCount: 0,
      };

      if (t.type === "BUY") holding.shares = Math.round((holding.shares + qty) * 1e8) / 1e8;
      else holding.shares = Math.round((holding.shares - qty) * 1e8) / 1e8;
      holding.tradeCount += 1;

      holdings.set(t.assetId, holding);
    }

    const positions = Array.from(holdings.values()).filter(
      (h) => h.shares > 0
    );

    const quotes = await getCurrentQuotesForUser(userId);

    const rows = positions.map((p) => {
      const q = quotes.get(p.ticker);
      return {
        ticker: p.ticker,
        name: p.name,
        sector: "",
        totalVolume: p.shares,
        tradeCount: p.tradeCount,
        lastPrice: q?.price ?? 0,
        changePercent: q?.changePercent ?? 0,
        currency: p.currency,
      };
    });

    rows.sort(
      (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );

    return { success: true, data: rows, error: null };
  } catch (error) {
    console.error("Error fetching holdings daily change:", error);
    return {
      success: false,
      data: null,
      error: "Failed to retrieve holdings daily change.",
    };
  }
}

// 5 Most Traded Stocks
export async function getTrendingStocks(): Promise<ActionResponse<TrendingStock[]>> {
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

    const trendingData = await Promise.all(topTraded.map(async (trade) => {
      const assetDetails = assets.find(a => a.id === trade.assetId);
      const ticker = assetDetails?.ticker || "Unknown";
      const currency = assetDetails?.currency ?? "USD";

      let lastPrice = 0;
      let changePercent = 0;

      if (ticker !== "Unknown") {
        const quote = await getMarketQuote(ticker);
        if (quote) {
          lastPrice = quote.price;
          changePercent = quote.changePercent;
        }
      }

      return {
        ticker,
        name: assetDetails?.companyName || "Unknown",
        sector: "",
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