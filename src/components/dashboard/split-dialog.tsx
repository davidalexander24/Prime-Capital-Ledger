"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scissors, XCircle } from "lucide-react";
import { applyStockSplit } from "@/app/actions/portfolio";
import { AppDialog, AppDialogBody, AppDialogClose, AppDialogFooter } from "@/components/app/app-dialog";
import { appButton, fieldInput, fieldLabel, notice } from "@/components/app/styles";
import { cn } from "@/lib/utils";

export function SplitAction({ ticker }: { ticker: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ratio, setRatio] = useState("8");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSplit() {
    if (!ratio || !date) return;
    setLoading(true);
    setError(null);
    const r = parseFloat(ratio);
    try {
      const res = await applyStockSplit(ticker, r, date);
      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to apply stock split.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppDialog
      size="sm"
      open={open}
      onOpenChange={(next) => {
        if (next) setError(null);
        setOpen(next);
      }}
      locked={loading}
      trigger={
        <button
          type="button"
          title="Apply stock split"
          className="ml-2 inline-flex items-center gap-1 rounded bg-layer-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-fg-4 transition-colors hover:bg-layer-3 hover:text-fg-2"
        >
          <Scissors className="size-3" />
          Split
        </button>
      }
      title="Apply stock split"
      description={`Adjust historical transactions for ${ticker.replace(".JK", "")}.`}
    >
      <AppDialogBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="split-ratio" className={fieldLabel}>
            Split ratio (8 for 8:1)
          </label>
          <input
            id="split-ratio"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            className={fieldInput}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="split-date" className={fieldLabel}>
            Effective date
          </label>
          <input
            id="split-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(fieldInput, "[color-scheme:dark]")}
          />
          <p className="text-[12px] text-fg-4">Transactions strictly before this date are adjusted.</p>
        </div>

        {error && (
          <div role="alert" className={notice({ tone: "error" })}>
            <XCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}
      </AppDialogBody>

      <AppDialogFooter>
        <AppDialogClose disabled={loading} className={appButton({ tone: "secondary" })}>
          Cancel
        </AppDialogClose>
        <button
          type="button"
          onClick={handleSplit}
          disabled={loading || !ratio || !date}
          className={appButton({ tone: "primary" })}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Scissors />}
          {loading ? "Applying..." : "Apply split"}
        </button>
      </AppDialogFooter>
    </AppDialog>
  );
}
