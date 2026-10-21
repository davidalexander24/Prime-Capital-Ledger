"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { currencyForTicker, isSupportedTicker } from "@/lib/currency";
import { formatMoney, formatQuantity } from "@/lib/format";

type ActionResponse = {
  success: boolean;
  message: string;
};

export interface LogTransactionInput {
  ticker: string;
  companyName: string;
  type: "BUY" | "SELL";
  inputMode: "shares" | "dollars";
  amount: number; // share count, or money amount in the asset's currency
  pricePerShare: number;
  fee: number;
  date: string;
}

function validateInput(input: LogTransactionInput): string | null {
  if (!input.ticker || input.ticker.trim().length === 0) {
    return "Ticker symbol is required.";
  }
  if (!isSupportedTicker(input.ticker)) {
    return "Only US and IDX (.JK) listings are supported.";
  }
  if (input.type !== "BUY" && input.type !== "SELL") {
    return "Invalid transaction type.";
  }
  if (input.inputMode !== "shares" && input.inputMode !== "dollars") {
    return "Invalid input mode.";
  }
  if (!Number.isFinite(input.pricePerShare) || input.pricePerShare <= 0) {
    return "Price per share must be a positive number.";
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "Amount must be a positive number.";
  }
  if (input.fee != null && (!Number.isFinite(input.fee) || input.fee < 0)) {
    return "Fee must be a non-negative number.";
  }
  if (Number.isNaN(new Date(input.date).getTime())) {
    return "Invalid transaction date.";
  }
  return null;
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

    const validationError = validateInput(input);
    if (validationError) {
      return { success: false, message: validationError };
    }

    // Calculate quantity
    const quantity =
      input.inputMode === "dollars"
        ? input.amount / input.pricePerShare
        : input.amount;

    const ticker = input.ticker.trim().toUpperCase();
    const companyName =
      input.companyName.trim() || `${ticker} Inc`;
    const currency = currencyForTicker(ticker);
    const transactionDate = new Date(input.date);

    await prisma.$transaction(async (tx) => {
      // Upsert the Asset record. Assets are shared by every user, so the
      // currency is rewritten too: a row created with the wrong one heals here.
      const asset = await tx.asset.upsert({
        where: { ticker },
        update: { currency },
        create: {
          ticker,
          companyName,
          currency,
        },
      });

      // Create the Transaction record
      await tx.transaction.create({
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
    });

    const displayQty =
      input.inputMode === "dollars"
        ? `${formatQuantity(quantity)} shares (${formatMoney(input.amount, currency)})`
        : `${formatQuantity(quantity)} shares`;

    return {
      success: true,
      message: `Successfully logged ${input.type} of ${displayQty} of ${ticker} at ${formatMoney(input.pricePerShare, currency)}/share.`,
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

    const validationError = validateInput(input);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const quantity =
      input.inputMode === "dollars"
        ? input.amount / input.pricePerShare
        : input.amount;

    const ticker = input.ticker.trim().toUpperCase();
    const companyName = input.companyName.trim() || `${ticker} Inc`;
    const currency = currencyForTicker(ticker);
    const transactionDate = new Date(input.date);

    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.upsert({
        where: { ticker },
        update: { currency },
        create: {
          ticker,
          companyName,
          currency,
        },
      });

      await tx.transaction.update({
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
