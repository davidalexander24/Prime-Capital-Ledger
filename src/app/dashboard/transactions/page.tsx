import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { TransactionTable } from "@/components/dashboard/transaction-table";
import { LogTransactionDialog } from "@/components/dashboard/log-transaction-dialog";
import { getTransactions } from "@/app/actions/transactions";
import { getCachedUsdIdrRate, getUserBaseCurrency } from "@/lib/requestData";
import { formatMoney } from "@/lib/format";
import { ArrowLeftRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const [res, fxRate, baseCurrency] = await Promise.all([
    getTransactions(),
    getCachedUsdIdrRate(),
    getUserBaseCurrency(session.user.id),
  ]);
  const transactions = res.success && res.data ? res.data : [];
  const rate = fxRate ?? 16000;

  const buyCount = transactions.filter((t) => t.type === "BUY").length;
  const sellCount = transactions.filter((t) => t.type === "SELL").length;
  const totalVolume = transactions.reduce((sum, t) => {
    const value = Math.abs(Number(t.netValue || 0));
    if (baseCurrency === "USD") {
      return sum + (t.currency === "IDR" ? value / rate : value);
    }
    return sum + (t.currency === "USD" ? value * rate : value);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.93_0.005_260)]">
            Transactions
          </h1>
          <p className="mt-1 text-[13px] text-[oklch(0.45_0.01_260)]">
            Complete history of all buy and sell ledger entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LogTransactionDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.12_0.01_230)]">
            <ArrowLeftRight className="h-5 w-5 text-[oklch(0.70_0.08_230)]" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
              Total Transactions
            </span>
            <p className="mt-0.5 text-lg font-semibold text-[oklch(0.93_0.005_260)]">
              {transactions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
              Buy / Sell
            </span>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-lg font-semibold text-[oklch(0.65_0.15_155)]">{buyCount} Buy</span>
              <span className="text-[oklch(0.25_0.005_260)]">/</span>
              <span className="text-lg font-semibold text-[oklch(0.65_0.15_25)]">{sellCount} Sell</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] p-5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
              Total Volume
            </span>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[oklch(0.93_0.005_260)]">
              {formatMoney(totalVolume, baseCurrency)}
            </p>
          </div>
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}
