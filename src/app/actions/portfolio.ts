"use server";

import prisma from "@/lib/prisma";
import { getLatestPrice, getUsdIdrRate } from "@/lib/marketData";

type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export interface HoldingRow {
  ticker: string;
  name: string;
  sector: string;
  currency: string;
  lots: number;
  avgPrice: number;
  lastPrice: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
  weight: number;
}

export interface PortfolioData {
  holdings: HoldingRow[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPct: number;
}

export async function getPortfolioHoldings(
  userId: string
): Promise<ActionResponse<PortfolioData>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { date: "asc" },
    });

    // Reconstruct holdings from transaction ledger
    const holdingsMap: Record<
      string,
      {
        ticker: string;
        companyName: string;
        currency: string;
        shares: number;
        totalCost: number;
      }
    > = {};

    for (const t of transactions) {
      if (!t.asset || !t.assetId) continue;

      const qty = Number(t.quantity);
      const price = Number(t.executionPrice);
      const fee = Number(t.fee);

      if (!holdingsMap[t.assetId]) {
        holdingsMap[t.assetId] = {
          ticker: t.asset.ticker,
          companyName: t.asset.companyName,
          currency: t.asset.currency ?? "USD",
          shares: 0,
          totalCost: 0,
        };
      }

      if (t.type === "BUY") {
        holdingsMap[t.assetId].shares += qty;
        holdingsMap[t.assetId].totalCost += qty * price + fee;
      }

      if (t.type === "SELL") {
        // Proportionally reduce cost basis
        const h = holdingsMap[t.assetId];
        const avgCostPerShare = h.shares > 0 ? h.totalCost / h.shares : 0;
        h.shares -= qty;
        h.totalCost -= avgCostPerShare * qty;
      }
    }

    // Fetch live prices and build holding rows
    const holdingEntries = Object.values(holdingsMap).filter(
      (h) => h.shares > 0
    );
    const rows: HoldingRow[] = [];
    let grandTotalMarket = 0;
    let grandTotalCost = 0;

    for (const h of holdingEntries) {
      const livePrice = await getLatestPrice(h.ticker);
      const lastPrice = livePrice ?? 0;
      const avgPrice = h.shares > 0 ? h.totalCost / h.shares : 0;
      const marketValue = h.shares * lastPrice;
      const costBasis = h.totalCost;
      const pnl = marketValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      grandTotalMarket += marketValue;
      grandTotalCost += costBasis;

      rows.push({
        ticker: h.ticker,
        name: h.companyName,
        currency: h.currency,
        sector: "",
        lots: h.shares,
        avgPrice: Math.round(avgPrice * 100) / 100,
        lastPrice,
        marketValue,
        costBasis,
        pnl,
        pnlPct,
        weight: 0, // calculated after totals
      });
    }

    // Calculate weight percentages
    for (const row of rows) {
      row.weight =
        grandTotalMarket > 0 ? (row.marketValue / grandTotalMarket) * 100 : 0;
    }

    // Sort by market value descending
    rows.sort((a, b) => b.marketValue - a.marketValue);

    const totalPnl = grandTotalMarket - grandTotalCost;
    const totalPnlPct =
      grandTotalCost > 0 ? (totalPnl / grandTotalCost) * 100 : 0;

    return {
      success: true,
      data: {
        holdings: rows,
        totalMarketValue: grandTotalMarket,
        totalCostBasis: grandTotalCost,
        totalPnl,
        totalPnlPct,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching portfolio holdings:", error);
    return {
      success: false,
      data: null,
      error: "Failed to retrieve portfolio holdings.",
    };
  }
}
