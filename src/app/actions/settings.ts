"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateBaseCurrency(currency: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    if (currency !== "USD" && currency !== "IDR") {
      return { success: false, message: "Unsupported currency." };
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { baseCurrency: currency },
    });
    return { success: true, message: "Base currency updated." };
  } catch (error: unknown) {
    console.error("Failed to update base currency:", error);
    return { success: false, message: "Failed to update base currency." };
  }
}
