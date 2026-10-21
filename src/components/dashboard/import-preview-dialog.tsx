"use client";

import { CheckCircle2, XCircle, Loader2, FileCheck } from "lucide-react";
import type { ParsedRow } from "@/app/actions/import";
import { formatDate, formatMoney } from "@/lib/format";
import { AppDialog, AppDialogBody, AppDialogClose, AppDialogFooter } from "@/components/app/app-dialog";
import { appButton, notice } from "@/components/app/styles";
import { TypeBadge } from "@/components/app/type-badge";

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ParsedRow[];
  sourceDate: string | null;
  status: "idle" | "loading" | "success" | "error";
  statusMessage: string;
  onConfirm: () => void;
}

const PREVIEW_LIMIT = 50;

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
    <AppDialog
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      locked={isLoading}
      title="Confirm import"
      description={`Found ${rows.length} transaction${rows.length === 1 ? "" : "s"}${
        sourceDate ? ` dated ${formatDate(sourceDate)}` : ""
      }.`}
    >
      <AppDialogBody className="flex flex-col gap-3">
        <div className="max-h-[300px] overflow-auto rounded-lg border border-line-soft">
          <table className="w-full min-w-[480px] text-left text-[12px]">
            <thead className="sticky top-0 bg-raised text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-4">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2 text-right">Quantity</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.slice(0, PREVIEW_LIMIT).map((r, i) => (
                <tr key={`${r.ticker}-${i}`} className="bg-sunken">
                  <td className="px-3 py-2">
                    <TypeBadge type={r.type} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-fg-1">{r.ticker}</div>
                    <div className="text-[11px] text-fg-4">{r.companyName}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg-2">
                    {r.quantityRaw ?? r.quantity.toFixed(6)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg-2">
                    {formatMoney(r.price, r.currency)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg-3">
                    {formatMoney(r.fee, r.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > PREVIEW_LIMIT && (
            <div className="bg-panel py-3 text-center text-[12px] font-medium text-fg-4">
              + {rows.length - PREVIEW_LIMIT} more transactions ready to import
            </div>
          )}
        </div>

        <p className="text-[12px] text-fg-4">Duplicates of existing transactions are skipped automatically.</p>

        {status === "success" && (
          <div role="status" className={notice({ tone: "success" })}>
            <CheckCircle2 className="size-3.5 shrink-0" />
            {statusMessage}
          </div>
        )}
        {status === "error" && (
          <div role="alert" className={notice({ tone: "error" })}>
            <XCircle className="size-3.5 shrink-0" />
            {statusMessage}
          </div>
        )}
      </AppDialogBody>

      <AppDialogFooter>
        <AppDialogClose disabled={isLoading} className={appButton({ tone: "secondary" })}>
          {isSuccess ? "Close" : "Cancel"}
        </AppDialogClose>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || isSuccess || rows.length === 0}
          className={appButton({ tone: "primary" })}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <FileCheck strokeWidth={2} />}
          {isSuccess ? "Done" : isLoading ? "Importing..." : `Import all (${rows.length})`}
        </button>
      </AppDialogFooter>
    </AppDialog>
  );
}
