"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import type { ParsedRow } from "@/app/actions/import";
import { formatDate, formatMoney } from "@/lib/format";

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ParsedRow[];
  sourceDate: string | null;
  status: "idle" | "loading" | "success" | "error";
  statusMessage: string;
  onConfirm: () => void;
}

export function ImportPreviewDialog({
  open,
  onOpenChange,
  rows,
  sourceDate,
  status,
  statusMessage,
  onConfirm,
}: ImportPreviewDialogProps) {
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
            <div>
              <Dialog.Title className="text-sm font-semibold text-fg-1">
                Confirm import
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[11px] text-fg-4">
                Found {rows.length} transaction{rows.length === 1 ? "" : "s"}
                {sourceDate ? ` dated ${formatDate(sourceDate)}` : ""}.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={isLoading}
              className="flex h-7 w-7 items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-layer-1 hover:text-fg-3 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-3 px-6 py-5">
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-line-soft">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-raised text-[9px] font-semibold uppercase tracking-widest text-fg-4">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {rows.slice(0, 50).map((r, i) => {
                    const isBuy = r.type === "BUY";
                    const quantityDisplay =
                      r.quantityRaw ?? r.quantity.toFixed(6);

                    return (
                      <tr key={`${r.ticker}-${i}`} className="bg-sunken">
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${isBuy
                                ? "bg-gain-wash text-gain"
                                : "bg-loss-wash text-loss"
                              }`}
                          >
                            {isBuy ? (
                              <ArrowDownLeft className="h-2.5 w-2.5" strokeWidth={2.5} />
                            ) : (
                              <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                            )}
                            {r.type}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-fg-1">
                            {r.ticker}
                          </div>
                          <div className="text-[10px] text-fg-4">
                            {r.companyName}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-fg-2">
                          {quantityDisplay}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-fg-2">
                          {formatMoney(r.price, r.currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-fg-3">
                          {formatMoney(r.fee, r.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 50 && (
                <div className="bg-panel py-3 text-center text-[11px] font-medium text-fg-4">
                  + {rows.length - 50} more transactions ready to import
                </div>
              )}
            </div>

            <p className="text-[10px] text-fg-4">
              Duplicates of existing transactions will be skipped automatically.
            </p>

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-gain-wash px-3 py-2 text-[11px] text-gain">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusMessage}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-loss-wash px-3 py-2 text-[11px] text-loss">
                <XCircle className="h-3.5 w-3.5" />
                {statusMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line-soft px-6 py-4">
            <Dialog.Close
              disabled={isLoading}
              className="flex h-9 items-center rounded-lg border border-line px-4 text-[12px] font-medium text-fg-3 transition-colors hover:bg-hover disabled:opacity-50"
            >
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || isSuccess || rows.length === 0}
              className={`flex h-9 items-center gap-2 rounded-lg px-5 text-[12px] font-semibold transition-all ${isLoading || isSuccess || rows.length === 0
                  ? "cursor-not-allowed bg-layer-2 text-fg-5"
                  : "bg-brand text-canvas hover:bg-brand-hover"
                }`}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCheck className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {isSuccess
                ? "Done"
                : isLoading
                  ? "Importing..."
                  : `Import all (${rows.length})`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
