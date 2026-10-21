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
          <h1 className="text-xl font-semibold tracking-tight text-fg-1">
            Transactions
          </h1>
          <p className="mt-1 text-[13px] text-fg-4">
            Complete history of all buy and sell ledger entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LogTransactionDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-wash">
            <ArrowLeftRight className="h-5 w-5 text-brand" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
              Total Transactions
            </span>
            <p className="mt-0.5 text-lg font-semibold text-fg-1">
              {transactions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
              Buy / Sell
            </span>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-lg font-semibold text-gain">{buyCount} Buy</span>
              <span className="text-fg-5">/</span>
              <span className="text-lg font-semibold text-loss">{sellCount} Sell</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-4">
              Total Volume
            </span>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg-1">
              {formatMoney(totalVolume, baseCurrency)}
            </p>
          </div>
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}
