"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type ActionResponse = {
  success: boolean;
  message: string;
};

export interface LogTransactionInput {
  ticker: string;
  companyName: string;
  type: "BUY" | "SELL";
  inputMode: "shares" | "dollars";
  amount: number; // shares count or dollar amount
  pricePerShare: number;
  fee: number;
  date: string; // ISO date string
  currency: string;
}

export async function createManualTransaction(
  input: LogTransactionInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    // Validate inputs
    if (!input.ticker || input.ticker.trim().length === 0) {
      return { success: false, message: "Ticker symbol is required." };
    }
    if (input.pricePerShare <= 0) {
      return { success: false, message: "Price per share must be greater than 0." };
    }
    if (input.amount <= 0) {
      return { success: false, message: "Amount must be greater than 0." };
    }

    // Calculate quantity: if dollars mode, derive fractional shares
    const quantity =
      input.inputMode === "dollars"
        ? input.amount / input.pricePerShare
        : input.amount;

    const ticker = input.ticker.trim().toUpperCase();
    const companyName =
      input.companyName.trim() || `${ticker} Inc`;
    const transactionDate = new Date(input.date);

    // Upsert the Asset record
    const asset = await prisma.asset.upsert({
      where: { ticker },
      update: {},
      create: {
        ticker,
        companyName,
        currency: input.currency || "USD",
      },
    });

    // Create the Transaction record
    await prisma.transaction.create({
      data: {
        userId,
        assetId: asset.id,
        type: input.type,
        quantity,
        executionPrice: input.pricePerShare,
        fee: input.fee || 0,
        date: transactionDate,
      },
    });

    const displayQty =
      input.inputMode === "dollars"
        ? `${quantity.toFixed(6)} shares ($${input.amount.toFixed(2)})`
        : `${quantity} shares`;

    return {
      success: true,
      message: `Successfully logged ${input.type} of ${displayQty} of ${ticker} at $${input.pricePerShare.toFixed(2)}/share.`,
    };
  } catch (error: unknown) {
    console.error("Error creating manual transaction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create transaction.",
    };
  }
}

export async function updateTransaction(
  transactionId: string,
  input: LogTransactionInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!existing) {
      return { success: false, message: "Transaction not found." };
    }

    if (!input.ticker || input.ticker.trim().length === 0) {
      return { success: false, message: "Ticker symbol is required." };
    }
    if (input.pricePerShare <= 0) {
      return { success: false, message: "Price per share must be greater than 0." };
    }
    if (input.amount <= 0) {
      return { success: false, message: "Amount must be greater than 0." };
    }

    const quantity =
      input.inputMode === "dollars"
        ? input.amount / input.pricePerShare
        : input.amount;

    const ticker = input.ticker.trim().toUpperCase();
    const companyName = input.companyName.trim() || `${ticker} Inc`;
    const transactionDate = new Date(input.date);

    const asset = await prisma.asset.upsert({
      where: { ticker },
      update: {},
      create: {
        ticker,
        companyName,
        currency: input.currency || "USD",
      },
    });

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        assetId: asset.id,
        type: input.type,
        quantity,
        executionPrice: input.pricePerShare,
        fee: input.fee || 0,
        date: transactionDate,
      },
    });

    return {
      success: true,
      message: `Transaction updated successfully.`,
    };
  } catch (error: unknown) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update transaction.",
    };
  }
}

export async function deleteTransaction(
  transactionId: string
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!existing) {
      return { success: false, message: "Transaction not found." };
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return {
      success: true,
      message: "Transaction deleted successfully.",
    };
  } catch (error: unknown) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete transaction.",
    };
  }
}
