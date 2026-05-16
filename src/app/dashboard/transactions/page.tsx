import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { TransactionTable } from "@/components/dashboard/transaction-table";
import { LogTransactionDialog } from "@/components/dashboard/log-transaction-dialog";
import { getTransactions } from "@/app/actions/transactions";
import { getUsdIdrRate } from "@/lib/marketData";
import { ArrowLeftRight, Filter, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export function formatVolumeIDR(value: number): string {
  return `Rp ${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = session.user.id;

  const [res, fxRate] = await Promise.all([
    getTransactions(userId),
    getUsdIdrRate(),
  ]);
  const transactions = res.success && res.data ? res.data : [];
  const rate = fxRate ?? 16000;

  const buyCount = transactions.filter((t) => t.type === "BUY").length;
  const sellCount = transactions.filter((t) => t.type === "SELL").length;
  const totalVolumeIDR = transactions.reduce((sum, t) => {
    const value = Math.abs(Number(t.netValue || 0));
    return sum + (t.currency === "IDR" ? value : value * rate);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
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
          <button className="flex h-9 items-center gap-2 rounded-lg border border-[oklch(0.14_0.005_260)] bg-transparent px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)]">
            <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
            Filter
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-[oklch(0.14_0.005_260)] bg-transparent px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)]">
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
            <p className="mt-0.5 text-lg font-semibold text-[oklch(0.93_0.005_260)]">
              {formatVolumeIDR(totalVolumeIDR)}
            </p>
          </div>
        </div>
      </div>

      <TransactionTable data={transactions} />
    </div>
  );
}
