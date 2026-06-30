"use server";

import { buildPortfolioTimeline } from "@/lib/timeline";

type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

function formatCurrencySigned(value: number, currency: string): string {
  const sign = value < 0 ? "-" : "+";
  const abs = Math.abs(value);
  if (currency === "USD") {
    return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${sign}Rp${Math.round(abs).toLocaleString("id-ID")}`;
}

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
    const timeline = await buildPortfolioTimeline(userId);
    const {
      baseCurrency,
      fxRate,
      monthlyValues,
      dailyReturns,
      maxDrawdown,
      realizedByCurrency,
      finalHoldings,
      lastPriceByTicker,
    } = timeline;

    if (!monthlyValues.length) {
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
            { label: "Realized P&L", value: formatCurrencySigned(0, baseCurrency), icon: "Wallet", detail: "Locked-in gains" },
          ],
        },
        error: null,
      };
    }

    // Build monthly returns array (cumulative)
    const monthlyReturns: MonthlyReturn[] = [];
    let cumulativeReturn = 0;

    for (const mv of monthlyValues) {
      const monthReturn = mv.start > 0 ? ((mv.end - mv.start) / mv.start) * 100 : 0;
      cumulativeReturn += monthReturn;

      const [year, month] = mv.monthKey.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;

      monthlyReturns.push({
        month: label,
        return: Math.round(cumulativeReturn * 100) / 100,
      });
    }

    // Sector / Asset Allocation
    // use per-ticker allocation by market value
    const allocationMap = new Map<string, { name: string; marketValue: number }>();
    let totalPortfolioValue = 0;

    for (const holding of finalHoldings) {
      const lastPrice = lastPriceByTicker[holding.ticker] ?? 0;
      const positionValue = holding.shares * lastPrice;
      const valueInBase = baseCurrency === "USD"
        ? (holding.currency === "IDR" ? positionValue / fxRate : positionValue)
        : (holding.currency === "USD" ? positionValue * fxRate : positionValue);

      allocationMap.set(holding.ticker, {
        name: holding.ticker,
        marketValue: valueInBase,
      });
      totalPortfolioValue += valueInBase;
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

    // Performance Metrics
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

    // Win Rate
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

    // Realized P&L, converted to the user's base currency.
    let realizedConverted = 0;
    for (const [cur, amount] of Object.entries(realizedByCurrency)) {
      realizedConverted += baseCurrency === "USD"
        ? (cur === "IDR" ? amount / fxRate : amount)
        : (cur === "USD" ? amount * fxRate : amount);
    }

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
      {
        label: "Realized P&L",
        value: formatCurrencySigned(realizedConverted, baseCurrency),
        icon: "Wallet",
        detail: "Locked-in gains",
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
