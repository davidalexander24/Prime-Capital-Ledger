"use server";

import prisma from "@/lib/prisma";
import type { TransactionRecord } from "@/lib/types";

type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export async function getTransactions(
  userId: string,
  limit?: number
): Promise<ActionResponse<TransactionRecord[]>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      ...(limit ? { take: limit } : {}),
      include: {
        asset: {
          select: { ticker: true, companyName: true, currency: true },
        },
      },
    });

    const serialized: TransactionRecord[] = transactions.map((t) => {
      const qty = Number(t.quantity);
      const price = Number(t.executionPrice);
      const fee = Number(t.fee);
      const grossValue = qty * price;
      const netValue =
        t.type === "BUY" ? grossValue + fee : grossValue - fee;

      return {
        id: t.id,
        executedAt: t.date.toISOString(),
        ticker: t.asset?.ticker ?? t.type,
        assetName: t.asset?.companyName ?? t.type,
        type: t.type as "BUY" | "SELL",
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

    return { success: true, data: serialized, error: null };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      data: null,
      error: "Failed to retrieve transactions.",
    };
  }
}
