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

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ParsedRow[];
  sourceDate: string | null;
  status: "idle" | "loading" | "success" | "error";
  statusMessage: string;
  onConfirm: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
            <div>
              <Dialog.Title className="text-sm font-semibold text-[oklch(0.90_0.005_260)]">
                Confirm import
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
                Found {rows.length} transaction{rows.length === 1 ? "" : "s"} dated {formatDate(sourceDate)}.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={isLoading}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[oklch(0.45_0.01_260)] transition-colors hover:bg-[oklch(0.10_0.005_260)] hover:text-[oklch(0.70_0.005_260)] disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-3 px-6 py-5">
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[oklch(0.12_0.005_260)]">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-[oklch(0.06_0.005_260)] text-[9px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[oklch(0.10_0.005_260)]">
                  {rows.slice(0, 50).map((r, i) => {
                    const isBuy = r.type === "BUY";
                    const quantityDisplay =
                      r.quantityRaw ?? r.quantity.toFixed(6);
                    const priceDisplay = r.priceRaw ?? r.price.toFixed(2);
                    const feeDisplay = r.feeRaw ?? r.fee.toFixed(2);

                    return (
                      <tr key={`${r.ticker}-${i}`} className="bg-[oklch(0.03_0.005_260)]">
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${isBuy
                                ? "bg-[oklch(0.18_0.06_155)] text-[oklch(0.75_0.14_155)]"
                                : "bg-[oklch(0.18_0.06_25)] text-[oklch(0.75_0.12_25)]"
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
                          <div className="font-semibold text-[oklch(0.90_0.005_260)]">
                            {r.ticker}
                          </div>
                          <div className="text-[10px] text-[oklch(0.40_0.01_260)]">
                            {r.companyName}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[oklch(0.80_0.005_260)]">
                          {quantityDisplay}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[oklch(0.80_0.005_260)]">
                          {r.currency === "IDR" ? "Rp " : "$"}{priceDisplay}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[oklch(0.60_0.005_260)]">
                          {r.currency === "IDR" ? "Rp " : "$"}{feeDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 50 && (
                <div className="bg-[oklch(0.04_0.005_260)] py-3 text-center text-[11px] font-medium text-[oklch(0.50_0.01_260)]">
                  + {rows.length - 50} more transactions ready to import
                </div>
              )}
            </div>

            <p className="text-[10px] text-[oklch(0.40_0.01_260)]">
              Duplicates of existing transactions will be skipped automatically.
            </p>

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.15_0.05_155)] px-3 py-2 text-[11px] text-[oklch(0.70_0.12_155)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusMessage}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.15_0.05_25)] px-3 py-2 text-[11px] text-[oklch(0.70_0.12_25)]">
                <XCircle className="h-3.5 w-3.5" />
                {statusMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[oklch(0.12_0.005_260)] px-6 py-4">
            <Dialog.Close
              disabled={isLoading}
              className="flex h-9 items-center rounded-lg border border-[oklch(0.14_0.005_260)] px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)] disabled:opacity-50"
            >
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || isSuccess || rows.length === 0}
              className={`flex h-9 items-center gap-2 rounded-lg px-5 text-[12px] font-semibold transition-all ${isLoading || isSuccess || rows.length === 0
                  ? "cursor-not-allowed bg-[oklch(0.12_0.005_260)] text-[oklch(0.30_0.005_260)]"
                  : "bg-[oklch(0.70_0.08_230)] text-[oklch(0.05_0.005_260)] hover:bg-[oklch(0.75_0.09_230)]"
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
