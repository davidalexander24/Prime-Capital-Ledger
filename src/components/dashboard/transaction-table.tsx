"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { TransactionRecord } from "@/lib/types";
import {
  LogTransactionDialog,
  type EditTransactionData,
} from "./log-transaction-dialog";
import { deleteTransaction } from "@/app/actions/logTransaction";
import { StockLogo } from "@/components/ui/stock-logo";

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

function toEditData(tx: TransactionRecord): EditTransactionData {
  return {
    id: tx.id,
    ticker: tx.ticker,
    companyName: tx.assetName,
    type: tx.type as "BUY" | "SELL",
    quantity: tx.quantity,
    pricePerShare: tx.pricePerShare,
    totalFees: tx.totalFees,
    executedAt: tx.executedAt,
    currency: tx.currency,
  };
}

export function TransactionTable({ data }: TransactionTableProps) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<EditTransactionData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleEdit(tx: TransactionRecord) {
    setEditTarget(toEditData(tx));
  }

  function handleDelete(tx: TransactionRecord) {
    setDeleteError(null);
    setDeleteTarget(tx);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteTransaction(deleteTarget.id);
    setDeleting(false);
    if (res.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      setDeleteError(res.message);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]">
      <div className="flex items-center justify-between gap-3 border-b border-[oklch(0.12_0.005_260)] px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[oklch(0.88_0.005_260)]">
            Transaction History
          </h2>
          <p className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
            Recent buy and sell ledger entries
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-[oklch(0.10_0.005_260)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.45_0.01_260)]">
          {data.length} entries
        </span>
      </div>

      {/* Mobile card list — visible only below md */}
      <ul className="divide-y divide-[oklch(0.10_0.005_260)] md:hidden">
        {data.length === 0 && (
          <li className="px-4 py-10 text-center text-[12px] text-[oklch(0.45_0.01_260)]">
            No transactions yet.
          </li>
        )}
        {data.map((tx) => (
          <li
            key={tx.id}
            className="flex flex-col gap-2 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <StockLogo ticker={tx.ticker} size={22} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                    {tx.ticker.replace(".JK", "")}
                  </span>
                  <span className="truncate text-[10px] text-[oklch(0.40_0.01_260)]">
                    {tx.assetName}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
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
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Row actions"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[oklch(0.55_0.01_260)] transition-colors hover:bg-[oklch(0.10_0.005_260)] hover:text-[oklch(0.85_0.005_260)] data-[state=open]:bg-[oklch(0.10_0.005_260)] data-[state=open]:text-[oklch(0.85_0.005_260)]"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      collisionPadding={8}
                      className="z-50 w-36 overflow-hidden rounded-lg border border-[oklch(0.18_0.005_260)] bg-[oklch(0.06_0.005_260)] shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
                    >
                      <DropdownMenu.Item
                        onSelect={() => handleEdit(tx)}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-medium text-[oklch(0.80_0.005_260)] outline-none transition-colors data-highlighted:bg-[oklch(0.10_0.005_260)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => handleDelete(tx)}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-medium text-[oklch(0.70_0.15_25)] outline-none transition-colors data-highlighted:bg-[oklch(0.15_0.04_25)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 pl-8.5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.06em] text-[oklch(0.40_0.01_260)]">
                  {formatDate(tx.executedAt)} · {formatTime(tx.executedAt)}
                </span>
                <span className="text-[11px] text-[oklch(0.60_0.005_260)]">
                  {tx.quantity} × {formatCurrency(tx.pricePerShare, tx.currency)}
                </span>
              </div>
              <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[oklch(0.90_0.005_260)]">
                {formatCurrency(tx.netValue, tx.currency, true)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table — visible md and up */}
      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[oklch(0.12_0.005_260)] hover:bg-transparent">
            <TableHead className="h-10 pl-6 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Date
            </TableHead>
            <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Asset
            </TableHead>
            <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Type
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Qty (Lots)
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Price
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Net Value
            </TableHead>
            <TableHead className="h-10 w-10 pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tx) => (
            <TableRow
              key={tx.id}
              className="group border-b border-[oklch(0.10_0.005_260)] transition-colors hover:bg-[oklch(0.07_0.005_260)]"
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
                <div className="flex items-center gap-3">
                  {/* Smaller 24px Logo */}
                  <StockLogo ticker={tx.ticker} size={24} />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                      {tx.ticker.replace(".JK", "")}
                    </span>
                    <span className="text-[10px] text-[oklch(0.40_0.01_260)]">
                      {tx.assetName}
                    </span>
                  </div>
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
              <TableCell className="text-right">
                <span className="text-[12px] font-semibold text-[oklch(0.88_0.005_260)]">
                  {formatCurrency(tx.netValue, tx.currency, true)}
                </span>
              </TableCell>
              <TableCell className="pr-6 text-right">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Row actions"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[oklch(0.45_0.01_260)] opacity-0 transition-all hover:bg-[oklch(0.10_0.005_260)] hover:text-[oklch(0.80_0.005_260)] focus:opacity-100 group-hover:opacity-100 data-[state=open]:bg-[oklch(0.10_0.005_260)] data-[state=open]:text-[oklch(0.80_0.005_260)] data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      collisionPadding={8}
                      className="z-50 w-36 overflow-hidden rounded-lg border border-[oklch(0.18_0.005_260)] bg-[oklch(0.06_0.005_260)] shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
                    >
                      <DropdownMenu.Item
                        onSelect={() => handleEdit(tx)}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-medium text-[oklch(0.80_0.005_260)] outline-none transition-colors data-highlighted:bg-[oklch(0.10_0.005_260)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => handleDelete(tx)}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-medium text-[oklch(0.70_0.15_25)] outline-none transition-colors data-highlighted:bg-[oklch(0.15_0.04_25)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Edit dialog (controlled) */}
      <LogTransactionDialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
        editData={editTarget}
      />

      {/* Delete confirmation dialog */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
            <div className="flex items-start gap-3 border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.15_0.04_25)]">
                <AlertTriangle className="h-4 w-4 text-[oklch(0.70_0.15_25)]" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-[oklch(0.90_0.005_260)]">
                  Delete transaction?
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[12px] leading-relaxed text-[oklch(0.50_0.01_260)]">
                  This will permanently remove the{" "}
                  <span className="font-semibold text-[oklch(0.75_0.005_260)]">
                    {deleteTarget?.type}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[oklch(0.75_0.005_260)]">
                    {deleteTarget?.quantity} × {deleteTarget?.ticker.replace(".JK", "")}
                  </span>
                  . This action can&apos;t be undone.
                </Dialog.Description>
              </div>
            </div>

            {deleteError && (
              <div className="mx-6 mt-4 rounded-lg bg-[oklch(0.15_0.05_25)] px-3 py-2 text-[11px] text-[oklch(0.70_0.12_25)]">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 px-6 py-4">
              <Dialog.Close
                disabled={deleting}
                className="flex h-9 items-center rounded-lg border border-[oklch(0.14_0.005_260)] px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex h-9 items-center gap-2 rounded-lg bg-[oklch(0.40_0.12_25)] px-5 text-[12px] font-semibold text-[oklch(0.95_0.01_25)] transition-colors hover:bg-[oklch(0.45_0.13_25)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}