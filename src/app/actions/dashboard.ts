"use server";

import prisma from '@/lib/prisma';
import { getLatestPrice, getUsdIdrRate, getMarketQuote } from '@/lib/marketData';
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
export async function getHistoricalValuations(userId: string): Promise<ActionResponse<any>> {
  try {
    const valuations = await prisma.dailyValuation.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    // Convert Decimals to native Numbers for frontend chart
    const serializedData = valuations.map((v) => ({
      ...v,
      cashBalanceUSD: Number(v.cashBalanceUSD),
      marketValueUSD: Number(v.marketValueUSD),
      totalEquityUSD: Number(v.totalEquityUSD),
      totalEquityIDR: Number(v.totalEquityIDR),
      exchangeRate: Number(v.exchangeRate),
      // Formatting the date to a simple string (YYYY-MM-DD) for Recharts X-Axis
      date: v.date.toISOString().split('T')[0]
    }));

    return { success: true, data: serializedData, error: null };
  } catch (error) {
    console.error("Error fetching historical valuations:", error);
    return { success: false, data: null, error: "Failed to retrieve valuation history." };
  }
}

// 10 Most Recent Ledger Entries
export async function getRecentTransactions(userId: string): Promise<ActionResponse<any>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        asset: {
          select: { ticker: true, companyName: true }
        }
      }
    });

    // Serialization Fix
    const serializedData = transactions.map((t) => ({
      ...t,
      quantity: Number(t.quantity),
      executionPrice: Number(t.executionPrice),
      fee: Number(t.fee),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString()
    }));

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

    // Fetch the live exchange rate to convert USD stocks to IDR
    const exchangeRate = await getUsdIdrRate() || 16000; // Fallback to 16,000 if API fails

    // Use Promise.all to map over the array and fetch live prices concurrently
    const trendingData = await Promise.all(topTraded.map(async (trade) => {
      const assetDetails = assets.find(a => a.id === trade.assetId);
      const ticker = assetDetails?.ticker || "Unknown";
      
      let priceUSD = 0;
      let changePercent = 0;

      if (ticker !== "Unknown") {
        // Use our new UI-specific quote fetcher
        const quote = await getMarketQuote(ticker);
        if (quote) {
          priceUSD = quote.price;
          changePercent = quote.changePercent;
        }
      }
      
      const lastPrice = priceUSD * exchangeRate;

      return {
        ticker,
        name: assetDetails?.companyName || "Unknown",
        sector: "TECH", // Fallback sector
        totalVolume: Number(trade._sum.quantity) || 0,
        tradeCount: trade._count.assetId,
        lastPrice,
        changePercent,
        currency: "IDR"
      };
    }));
    
    return { success: true, data: trendingData, error: null };
  } catch (error) {
    console.error("Error calculating trending stocks:", error);
    return { success: false, data: null, error: "Failed to calculate trending assets." };
  }
}