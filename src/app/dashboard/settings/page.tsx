import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import prisma from "@/lib/prisma";
import { SettingsView } from "@/components/dashboard/settings-view";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [transactionCount, lastTransaction, userRecord, oauthAccount] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true }
    }),
    prisma.account.findFirst({
      where: { userId, provider: "google" }
    }),
  ]);

  return (
    <SettingsView
      name={session.user.name}
      email={session.user.email}
      baseCurrency={userRecord?.baseCurrency || "IDR"}
      isGoogleAuth={!!oauthAccount}
      transactionCount={transactionCount}
      lastEntryLabel={lastTransaction ? formatDate(lastTransaction.date) : "—"}
    />
  );
}
