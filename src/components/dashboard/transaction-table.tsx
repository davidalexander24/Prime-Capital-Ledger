import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { TransactionRecord } from "@/lib/types";

interface TransactionTableProps {
  data: TransactionRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatIDR(value: number): string {
  const rounded = Math.round(Math.abs(value));
  return `Rp${rounded.toLocaleString("id-ID")}`;
}

function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

function formatCurrency(value: number, currency?: string, withSign = false): string {
  const sign = value < 0 ? "-" : "";
  const formatted = currency === "USD" ? formatUSD(Math.abs(value)) : formatIDR(Math.abs(value));
  return withSign ? `${sign}${formatted}` : formatted;
}

export function TransactionTable({ data }: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="flex items-center justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
            Transaction History
          </h2>
          <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
            Recent buy and sell ledger entries
          </p>
        </div>
        <span className="rounded-md bg-[oklch(0.10_0.005_260)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
          {data.length} entries
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-b border-[oklch(0.12_0.005_260)] hover:bg-transparent">
            <TableHead className="h-10 pl-6 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Date
            </TableHead>
            <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Asset
            </TableHead>
            <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Type
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Qty (Lots)
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Price
            </TableHead>
            <TableHead className="h-10 pr-6 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.40_0.01_260)]">
              Net Value
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tx) => (
            <TableRow
              key={tx.id}
              className="border-b border-[oklch(0.10_0.005_260)] transition-colors hover:bg-[oklch(0.07_0.005_260)]"
            >
              <TableCell className="pl-6">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                    {formatDate(tx.executedAt)}
                  </span>
                  <span className="text-[10px] text-[oklch(0.38_0.01_260)]">
                    {formatTime(tx.executedAt)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                    {tx.ticker.replace(".JK", "")}
                  </span>
                  <span className="text-[10px] text-[oklch(0.40_0.01_260)]">
                    {tx.assetName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    tx.type === "BUY"
                      ? "bg-[oklch(0.15_0.04_155)] text-[oklch(0.70_0.15_155)]"
                      : "bg-[oklch(0.15_0.04_25)] text-[oklch(0.70_0.15_25)]"
                  }`}
                >
                  {tx.type === "BUY" ? (
                    <ArrowDownLeft className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                  )}
                  {tx.type}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                  {tx.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-[12px] font-medium text-[oklch(0.80_0.005_260)]">
                  {formatCurrency(tx.pricePerShare, tx.currency)}
                </span>
              </TableCell>
              <TableCell className="pr-6 text-right">
                <span className="text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                  {formatCurrency(tx.netValue, tx.currency, true)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
