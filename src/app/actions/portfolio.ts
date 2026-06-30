"use server";

import prisma from "@/lib/prisma";
import { getLedger, getCurrentQuotesForUser } from "@/lib/requestData";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
  hasMissingBuy?: boolean;
}

export interface PortfolioData {
  holdings: HoldingRow[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPct: number;
  realizedByCurrency: Record<string, number>;
  investedByCurrency: Record<string, number>;
}

export async function getPortfolioHoldings(
  userId: string
): Promise<ActionResponse<PortfolioData>> {
  try {
    const transactions = await getLedger(userId);

    // Reconstruct holdings from transaction ledger
    const holdingsMap: Record<
      string,
      {
        ticker: string;
        companyName: string;
        currency: string;
        shares: number;
        totalCost: number;
        hasMissingBuy: boolean;
      }
    > = {};

    // Realized P&L locked in from SELLs and total capital deployed via BUYs,
    // tracked per currency so the page can convert with live FX.
    const realizedByCurrency: Record<string, number> = {};
    const investedByCurrency: Record<string, number> = {};

    for (const t of transactions) {
      if (!t.asset || !t.assetId) continue;

      const qty = Number(t.quantity);
      const price = Number(t.executionPrice);
      const fee = Number(t.fee);
      const currency = t.asset.currency ?? "USD";

      if (!holdingsMap[t.assetId]) {
        holdingsMap[t.assetId] = {
          ticker: t.asset.ticker,
          companyName: t.asset.companyName,
          currency: t.asset.currency ?? "USD",
          shares: 0,
          totalCost: 0,
          hasMissingBuy: false,
        };
      }

      if (t.type === "BUY") {
        holdingsMap[t.assetId].shares = Math.round((holdingsMap[t.assetId].shares + qty) * 1e8) / 1e8;
        holdingsMap[t.assetId].totalCost += qty * price + fee;
        investedByCurrency[currency] = (investedByCurrency[currency] ?? 0) + qty * price + fee;
      }

      if (t.type === "SELL") {
        // Proportionally reduce cost basis
        const h = holdingsMap[t.assetId];
        const avgCostPerShare = h.shares !== 0 ? h.totalCost / h.shares : 0;
        const realized = (qty * price - fee) - avgCostPerShare * qty;
        realizedByCurrency[currency] = (realizedByCurrency[currency] ?? 0) + realized;
        h.shares = Math.round((h.shares - qty) * 1e8) / 1e8;
        if (h.shares < 0) {
          h.shares = 0;
          h.hasMissingBuy = true;
        }
        h.totalCost -= avgCostPerShare * qty;
        if (h.shares === 0) h.totalCost = 0;
      }
    }

    // Fetch live prices and build holding rows
    const holdingEntries = Object.values(holdingsMap).filter(
      (h) => h.shares > 0 || h.hasMissingBuy
    );
    const rows: HoldingRow[] = [];
    let grandTotalMarket = 0;
    let grandTotalCost = 0;

    // Single batched quote fetch shared across the request.
    const quotes = await getCurrentQuotesForUser(userId);

    for (const h of holdingEntries) {
      const lastPrice = quotes.get(h.ticker)?.price ?? 0;
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
        hasMissingBuy: h.hasMissingBuy,
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
        realizedByCurrency,
        investedByCurrency,
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

export async function applyStockSplit(
  ticker: string,
  splitRatio: number,
  effectiveDateStr: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, data: null, error: "Unauthorized" };
    }
    const userId = session.user.id;
    
    const asset = await prisma.asset.findUnique({
      where: { ticker }
    });
    if (!asset) return { success: false, data: null, error: "Asset not found" };

    const effectiveDate = new Date(effectiveDateStr);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        assetId: asset.id,
        date: { lt: effectiveDate },
      }
    });

    await prisma.$transaction(async (tx) => {
      for (const t of transactions) {
        const newQty = Number(t.quantity) * splitRatio;
        const newPrice = Number(t.executionPrice) / splitRatio;
        
        await tx.transaction.update({
          where: { id: t.id },
          data: {
            quantity: newQty,
            executionPrice: newPrice,
          }
        });
      }
    });

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error("Error applying stock split:", error);
    return { success: false, data: null, error: "Failed to apply stock split." };
  }
}
