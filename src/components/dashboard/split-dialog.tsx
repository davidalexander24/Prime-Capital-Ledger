"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scissors, XCircle } from "lucide-react";
import { applyStockSplit } from "@/app/actions/portfolio";
import { AppDialog, AppDialogBody, AppDialogClose, AppDialogFooter } from "@/components/app/app-dialog";
import { RowMenu, RowMenuItem } from "@/components/app/row-menu";
import { appButton, fieldInput, fieldLabel, notice } from "@/components/app/styles";
import { cn } from "@/lib/utils";

function SplitDialog({
  ticker,
  open,
  onOpenChange,
  returnFocusRef,
}: {
  ticker: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const [ratio, setRatio] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedRatio = parseFloat(ratio);
  const canApply = parsedRatio > 0 && parsedRatio !== 1 && !!date && !loading;

  async function handleSplit() {
    if (!canApply) return;
    setLoading(true);
    setError(null);
    try {
      const res = await applyStockSplit(ticker, parsedRatio, date);
      if (res.success) {
        onOpenChange(false);
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
      onOpenChange={onOpenChange}
      locked={loading}
      returnFocusRef={returnFocusRef}
      title="Apply stock split"
      description={`Adjust historical transactions for ${ticker.replace(".JK", "")}.`}
    >
      <AppDialogBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="split-ratio" className={fieldLabel}>
            Split ratio
          </label>
          <input
            id="split-ratio"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            placeholder="2"
            className={fieldInput}
          />
          <p className="text-[12px] text-fg-4">New shares per old share: 2 for a 2-for-1 split, 0.1 for a 1-for-10 reverse split.</p>
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
        <button type="button" onClick={handleSplit} disabled={!canApply} className={appButton({ tone: "primary" })}>
          {loading ? <Loader2 className="animate-spin" /> : <Scissors />}
          {loading ? "Applying..." : "Apply split"}
        </button>
      </AppDialogFooter>
    </AppDialog>
  );
}

// Row menu for a holding. Splits are rare, so the action lives here instead
// of a chip on every row.
export function HoldingActions({ ticker, className }: { ticker: string; className?: string }) {
  const [splitOpen, setSplitOpen] = useState(false);
  // Remounting the dialog on each open clears the last attempt's values.
  const [session, setSession] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <RowMenu ref={triggerRef} label={`Actions for ${ticker.replace(".JK", "")}`} className={className}>
        <RowMenuItem
          icon={<Scissors />}
          onSelect={() => {
            setSession((s) => s + 1);
            setSplitOpen(true);
          }}
        >
          Apply stock split
        </RowMenuItem>
      </RowMenu>
      <SplitDialog
        key={session}
        ticker={ticker}
        open={splitOpen}
        onOpenChange={setSplitOpen}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
