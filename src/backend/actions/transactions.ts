"use server";

import prisma from "@/lib/prisma";
import type { TransactionRecord } from "@/lib/types";

// This is an example Server Action that runs purely on the backend.
// You can call this function directly from your React Client Components.
export async function getTransactionsByUserId(userId: string): Promise<TransactionRecord[]> {
  try {
    // This will hit your real database once Prisma is connected
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { date: "desc" },
    });

    // Map Prisma models to your frontend types
    return transactions.map((t) => {
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
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    // Fallback to dummy data during development if DB isn't seeded
    const { transactions: dummyTransactions } = await import("@/lib/dummy-data");
    return dummyTransactions;
  }
}
