"use server";

import { db } from "@/backend/db";
import type { TransactionRecord } from "@/lib/types";

// This is an example Server Action that runs purely on the backend.
// You can call this function directly from your React Client Components.
export async function getTransactionsByUserId(userId: string): Promise<TransactionRecord[]> {
  try {
    // This will hit your real database once Prisma is connected
    const transactions = await db.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { executedAt: "desc" },
    });

    // Map Prisma models to your frontend types
    return transactions.map((t) => ({
      id: t.id,
      date: t.executedAt.toISOString(),
      assetId: t.assetId,
      ticker: t.asset.ticker,
      name: t.asset.name,
      sector: t.asset.sector || "Unknown",
      type: t.type as "BUY" | "SELL" | "DIVIDEND",
      quantity: t.quantity,
      price: t.price,
      netValue: t.netValue,
    }));
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    // Fallback to dummy data during development if DB isn't seeded
    const { transactions: dummyTransactions } = await import("@/lib/dummy-data");
    return dummyTransactions;
  }
}
