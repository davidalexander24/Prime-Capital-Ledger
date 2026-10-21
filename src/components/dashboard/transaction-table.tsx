"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  ReceiptText,
  XCircle,
} from "lucide-react";
import type { TransactionRecord } from "@/lib/types";
import {
  LogTransactionDialog,
  type EditTransactionData,
} from "./log-transaction-dialog";
import { deleteTransaction } from "@/app/actions/logTransaction";
import { StockLogo } from "@/components/ui/stock-logo";
import { AppDialog, AppDialogBody, AppDialogClose, AppDialogFooter } from "@/components/app/app-dialog";
import { appButton, notice } from "@/components/app/styles";
import { TypeBadge } from "@/components/app/type-badge";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  data: TransactionRecord[];
  title?: string;
  subtitle?: string;
  // Dashboard preview: link to the full ledger instead of an entry count.
  viewAllHref?: string;
  // Shown under the empty-state message, e.g. a "Log transaction" button.
  emptyAction?: React.ReactNode;
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
  };
}

const headCell = "h-10 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-4";

function RowActions({
  className,
  onEdit,
  onDelete,
}: {
  className?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Row actions"
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-layer-1 hover:text-fg-1 data-[state=open]:bg-layer-1 data-[state=open]:text-fg-1",
            className
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 w-40 overflow-hidden rounded-lg border border-line-strong bg-raised p-1 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium text-fg-2 outline-none transition-colors data-highlighted:bg-hover data-highlighted:text-fg-1"
          >
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium text-loss outline-none transition-colors data-highlighted:bg-loss-wash"
          >
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function TransactionTable({
  data,
  title = "Transaction history",
  subtitle = "Buy and sell ledger entries",
  viewAllHref,
  emptyAction,
}: TransactionTableProps) {
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
    try {
      const res = await deleteTransaction(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setDeleteError(res.message);
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden surface-card">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg-1">{title}</h2>
          <p className="mt-0.5 text-[12px] text-fg-4">{subtitle}</p>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-brand transition-colors hover:bg-brand-wash hover:text-brand-hover"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <span className="shrink-0 rounded-md bg-layer-1 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-fg-3">
            {data.length} {data.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-layer-1 text-fg-4">
            <ReceiptText className="size-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-fg-2">No transactions yet</p>
            <p className="mt-1 text-[12px] text-fg-4">Import a broker statement or log a trade to start the ledger.</p>
          </div>
          {emptyAction}
        </div>
      ) : (
        <>
          {/* Mobile card list, below md */}
          <ul className="divide-y divide-line-soft md:hidden">
            {data.map((tx) => (
              <li key={tx.id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <StockLogo ticker={tx.ticker} size={22} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-fg-1">
                        {tx.ticker.replace(".JK", "")}
                      </span>
                      <span className="truncate text-[11px] text-fg-4">{tx.assetName}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <TypeBadge type={tx.type} />
                    <RowActions onEdit={() => handleEdit(tx)} onDelete={() => handleDelete(tx)} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pl-8.5">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-fg-4">{formatDate(tx.executedAt)}</span>
                    <span className="text-[12px] tabular-nums text-fg-3">
                      {formatQuantity(tx.quantity)} × {formatMoney(tx.pricePerShare, tx.currency)}
                    </span>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-fg-1">
                    {formatMoney(tx.netValue, tx.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table, md and up */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-line-soft hover:bg-transparent">
                  <TableHead className={cn(headCell, "pl-6")}>Date</TableHead>
                  <TableHead className={headCell}>Asset</TableHead>
                  <TableHead className={headCell}>Type</TableHead>
                  <TableHead className={cn(headCell, "text-right")}>Shares</TableHead>
                  <TableHead className={cn(headCell, "text-right")}>Price</TableHead>
                  <TableHead className={cn(headCell, "text-right")}>Net value</TableHead>
                  <TableHead className="h-10 w-12 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((tx) => (
                  <TableRow key={tx.id} className="group border-b border-line-soft transition-colors hover:bg-hover">
                    <TableCell className="pl-6 text-[12px] font-medium text-fg-2">{formatDate(tx.executedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StockLogo ticker={tx.ticker} size={24} />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-fg-1">{tx.ticker.replace(".JK", "")}</span>
                          <span className="text-[11px] text-fg-4">{tx.assetName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={tx.type} />
                    </TableCell>
                    <TableCell className="text-right text-[12px] font-medium tabular-nums text-fg-2">
                      {formatQuantity(tx.quantity)}
                    </TableCell>
                    <TableCell className="text-right text-[12px] font-medium tabular-nums text-fg-2">
                      {formatMoney(tx.pricePerShare, tx.currency)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums text-fg-1">
                      {formatMoney(tx.netValue, tx.currency)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {/* Hidden until hover only where there is a mouse; touch screens keep it visible. */}
                      <RowActions
                        className="ml-auto pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        onEdit={() => handleEdit(tx)}
                        onDelete={() => handleDelete(tx)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <LogTransactionDialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
        editData={editTarget}
      />

      <AppDialog
        size="sm"
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        locked={deleting}
        icon={
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-loss-wash text-loss">
            <AlertTriangle className="size-4" />
          </div>
        }
        title="Delete transaction?"
        description={
          deleteTarget ? (
            <>
              This removes the <span className="font-semibold text-fg-2">{deleteTarget.type}</span> of{" "}
              <span className="font-semibold text-fg-2">
                {formatQuantity(deleteTarget.quantity)} × {deleteTarget.ticker.replace(".JK", "")}
              </span>{" "}
              on {formatDate(deleteTarget.executedAt)}. This can&apos;t be undone.
            </>
          ) : null
        }
      >
        {deleteError && (
          <AppDialogBody>
            <div role="alert" className={notice({ tone: "error" })}>
              <XCircle className="size-3.5 shrink-0" />
              {deleteError}
            </div>
          </AppDialogBody>
        )}
        <AppDialogFooter>
          <AppDialogClose disabled={deleting} className={appButton({ tone: "secondary" })}>
            Cancel
          </AppDialogClose>
          <button type="button" onClick={confirmDelete} disabled={deleting} className={appButton({ tone: "sell" })}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete
          </button>
        </AppDialogFooter>
      </AppDialog>
    </div>
  );
}
