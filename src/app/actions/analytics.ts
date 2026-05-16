"use server";

import prisma from "@/lib/prisma";
import { getHistoricalPrices, getUsdIdrRate } from "@/lib/marketData";

type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export interface MonthlyReturn {
  month: string;
  return: number;
}

export interface SectorAllocation {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsMetric {
  label: string;
  value: string;
  icon: string;
  detail: string;
}

export interface AnalyticsData {
  monthlyReturns: MonthlyReturn[];
  sectorAllocation: SectorAllocation[];
  metrics: AnalyticsMetric[];
}

const SECTOR_COLORS = [
  "oklch(0.70 0.08 230)",  // blue
  "oklch(0.65 0.15 155)",  // green
  "oklch(0.70 0.12 80)",   // yellow
  "oklch(0.60 0.18 25)",   // red
  "oklch(0.65 0.10 300)",  // purple
  "oklch(0.70 0.10 180)",  // teal
  "oklch(0.65 0.08 50)",   // orange
  "oklch(0.55 0.12 270)",  // indigo
];

export async function getAnalyticsData(
  userId: string
): Promise<ActionResponse<AnalyticsData>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        asset: {
          select: { id: true, ticker: true, companyName: true, currency: true },
        },
      },
      orderBy: { date: "asc" },
    });

    if (!transactions.length) {
      return {
        success: true,
        data: {
          monthlyReturns: [],
          sectorAllocation: [],
          metrics: [
            { label: "Sharpe Ratio", value: "0.00", icon: "Target", detail: "Risk-adjusted return" },
            { label: "Max Drawdown", value: "0.00%", icon: "Activity", detail: "Peak to trough" },
            { label: "Win Rate", value: "0.0%", icon: "TrendingUp", detail: "Profitable trades" },
            { label: "Avg Return", value: "0.00%", icon: "BarChart3", detail: "Monthly average" },
          ],
        },
        error: null,
      };
    }

    // ── 1. Compute Monthly Returns ──
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
      (await getUsdIdrRate()) ??
      fxHistory?.[fxHistory.length - 1]?.close ??
      16000;

    // Build daily transaction lookup
    const txByDate = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const dateKey = tx.date.toISOString().split("T")[0];
      const list = txByDate.get(dateKey);
      if (list) list.push(tx);
      else txByDate.set(dateKey, [tx]);
    }

    // Holdings tracker
    const holdings = new Map<
      string,
      { ticker: string; currency: string; shares: number; totalCost: number }
    >();

    // Monthly portfolio values: { monthKey -> { start: number, end: number } }
    const monthlyValues = new Map<string, { start: number; end: number; firstDay: boolean }>();
    let prevDayMarketValue = 0;

    // Daily returns for Sharpe calculation
    const dailyReturns: number[] = [];
    let peakValue = 0;
    let maxDrawdown = 0;

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
          holding.shares += qty;
          holding.totalCost += grossValue + fee;
        } else if (tx.type === "SELL") {
          const avgCost = holding.shares > 0 ? holding.totalCost / holding.shares : 0;
          holding.shares -= qty;
          holding.totalCost -= avgCost * qty;
        }

        holdings.set(tx.assetId, holding);
      }

      // Calculate today's market value
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
        if (holding.currency === "IDR") marketValueIDR += positionValue;
        else marketValueUSD += positionValue;
      }

      const totalMarketValue = marketValueUSD * fxRate + marketValueIDR;

      // Track daily returns
      if (prevDayMarketValue > 0 && totalMarketValue > 0) {
        const dailyReturn = (totalMarketValue - prevDayMarketValue) / prevDayMarketValue;
        dailyReturns.push(dailyReturn);
      }

      // Track max drawdown
      if (totalMarketValue > peakValue) peakValue = totalMarketValue;
      if (peakValue > 0) {
        const drawdown = (peakValue - totalMarketValue) / peakValue;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      prevDayMarketValue = totalMarketValue;

      // Monthly tracking
      const monthKey = dateKey.substring(0, 7); // "YYYY-MM"
      const existing = monthlyValues.get(monthKey);
      if (!existing) {
        monthlyValues.set(monthKey, { start: totalMarketValue, end: totalMarketValue, firstDay: true });
      } else {
        existing.end = totalMarketValue;
      }
    }

    // Build monthly returns array
    const monthlyReturns: MonthlyReturn[] = [];
    let cumulativeReturn = 0;

    for (const [monthKey, mv] of monthlyValues) {
      const monthReturn = mv.start > 0 ? ((mv.end - mv.start) / mv.start) * 100 : 0;
      cumulativeReturn += monthReturn;

      const [year, month] = monthKey.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;

      monthlyReturns.push({
        month: label,
        return: Math.round(cumulativeReturn * 100) / 100,
      });
    }

    // ── 2. Sector / Asset Allocation ──
    // Since we don't have sector data, use per-ticker allocation by market value
    const allocationMap = new Map<string, { name: string; marketValue: number }>();
    let totalPortfolioValue = 0;

    for (const holding of holdings.values()) {
      if (holding.shares <= 0) continue;
      const lastPrice = lastPriceByTicker.get(holding.ticker) ?? 0;
      const positionValue = holding.shares * lastPrice;
      const valueInIDR = holding.currency === "IDR" ? positionValue : positionValue * fxRate;

      allocationMap.set(holding.ticker, {
        name: holding.ticker,
        marketValue: valueInIDR,
      });
      totalPortfolioValue += valueInIDR;
    }

    const sectorAllocation: SectorAllocation[] = Array.from(allocationMap.values())
      .sort((a, b) => b.marketValue - a.marketValue)
      .map((item, index) => ({
        name: item.name,
        value: totalPortfolioValue > 0
          ? Math.round((item.marketValue / totalPortfolioValue) * 1000) / 10
          : 0,
        color: SECTOR_COLORS[index % SECTOR_COLORS.length],
      }));

    // ── 3. Performance Metrics ──
    // Sharpe Ratio (annualized, assuming ~252 trading days, risk-free = 0)
    const avgDailyReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
      : 0;
    const stdDailyReturn = dailyReturns.length > 1
      ? Math.sqrt(
          dailyReturns.reduce((s, r) => s + Math.pow(r - avgDailyReturn, 2), 0) /
            (dailyReturns.length - 1)
        )
      : 0;
    const sharpeRatio = stdDailyReturn > 0
      ? (avgDailyReturn / stdDailyReturn) * Math.sqrt(252)
      : 0;

    // Win Rate: % of BUY→SELL trades that were profitable
    // Simplified: % of months with positive returns
    const positiveMonths = monthlyReturns.filter(
      (m, i) => i > 0 && m.return > monthlyReturns[i - 1].return
    ).length;
    const totalMonths = Math.max(monthlyReturns.length - 1, 1);
    const winRate = (positiveMonths / totalMonths) * 100;

    // Average monthly return
    const monthlyReturnValues = monthlyReturns.map(
      (m, i) => i > 0 ? m.return - monthlyReturns[i - 1].return : m.return
    );
    const avgMonthlyReturn = monthlyReturnValues.length > 0
      ? monthlyReturnValues.reduce((s, r) => s + r, 0) / monthlyReturnValues.length
      : 0;

    const metrics: AnalyticsMetric[] = [
      {
        label: "Sharpe Ratio",
        value: sharpeRatio.toFixed(2),
        icon: "Target",
        detail: "Risk-adjusted return",
      },
      {
        label: "Max Drawdown",
        value: `${(maxDrawdown * 100).toFixed(2)}%`,
        icon: "Activity",
        detail: "Peak to trough",
      },
      {
        label: "Win Rate",
        value: `${winRate.toFixed(1)}%`,
        icon: "TrendingUp",
        detail: "Profitable months",
      },
      {
        label: "Avg Return",
        value: `${avgMonthlyReturn.toFixed(2)}%`,
        icon: "BarChart3",
        detail: "Monthly average",
      },
    ];

    return {
      success: true,
      data: { monthlyReturns, sectorAllocation, metrics },
      error: null,
    };
  } catch (error) {
    console.error("Error calculating analytics:", error);
    return {
      success: false,
      data: null,
      error: "Failed to calculate analytics data.",
    };
  }
}
