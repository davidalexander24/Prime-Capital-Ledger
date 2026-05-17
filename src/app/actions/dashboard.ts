"use server";

import prisma from '@/lib/prisma';
import {
  getLatestPrice,
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
    const [transactions, userRecord] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: {
          asset: {
            select: { id: true, ticker: true, currency: true },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      })
    ]);
    const baseCurrency = userRecord?.baseCurrency || "IDR";

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

    // FX rate
    const fxRate =
      (await getUsdIdrRate()) ??
      fxHistory?.[fxHistory.length - 1]?.close ??
      16000;

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

    let previousMarketValue = 0;

    const valuationSeries: PortfolioValuationPoint[] = [];

    // zero-day before the first transaction
    const seedDate = new Date(startDate);
    seedDate.setUTCDate(seedDate.getUTCDate() - 1);
    valuationSeries.push({
      date: seedDate.toISOString().split('T')[0],
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
      const dateKey = cursor.toISOString().split('T')[0];
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

      const totalMarketValue = baseCurrency === "USD"
        ? marketValueUSD + (marketValueIDR / fxRate)
        : marketValueUSD * fxRate + marketValueIDR;
      const totalCostBasis = baseCurrency === "USD"
        ? costBasisUSD + (costBasisIDR / fxRate)
        : costBasisUSD * fxRate + costBasisIDR;
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

    // override the final point with live prices
    const lastPoint = valuationSeries[valuationSeries.length - 1];
    if (lastPoint && holdings.size > 0) {
      const liveTickers = Array.from(holdings.values())
        .filter((h) => h.shares > 0)
        .map((h) => h.ticker);
      const livePrices = await Promise.all(
        liveTickers.map((t) => getLatestPrice(t))
      );
      const liveByTicker = new Map<string, number>();
      liveTickers.forEach((t, i) => {
        const p = livePrices[i];
        if (p != null) liveByTicker.set(t, p);
      });

      let liveMvUSD = 0;
      let liveMvIDR = 0;
      for (const holding of holdings.values()) {
        if (holding.shares <= 0) continue;
        const price =
          liveByTicker.get(holding.ticker) ??
          lastPriceByTicker.get(holding.ticker) ??
          0;
        const positionValue = holding.shares * price;
        if (holding.currency === "IDR") liveMvIDR += positionValue;
        else liveMvUSD += positionValue;
      }
      const liveTotalMarketValue = baseCurrency === "USD"
        ? liveMvUSD + (liveMvIDR / fxRate)
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
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { date: "asc" },
    });

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

    const quotes = await Promise.all(
      positions.map((p) => getMarketQuote(p.ticker))
    );

    const rows = positions.map((p, i) => {
      const q = quotes[i];
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