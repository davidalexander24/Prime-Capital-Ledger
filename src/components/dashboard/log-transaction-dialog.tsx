"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  DollarSign,
  Banknote,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import {
  createManualTransaction,
  updateTransaction,
  type LogTransactionInput,
} from "@/app/actions/logTransaction";
import { currencyForTicker } from "@/lib/currency";
import { formatMoney, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppDialog, AppDialogBody, AppDialogClose, AppDialogFooter } from "@/components/app/app-dialog";
import { appButton, fieldInput, fieldLabel, notice } from "@/components/app/styles";
import { TickerSearch } from "./ticker-search";

export interface EditTransactionData {
  id: string;
  ticker: string;
  companyName: string;
  type: "BUY" | "SELL";
  quantity: number;
  pricePerShare: number;
  totalFees: number;
  executedAt: string;
}

interface LogTransactionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editData?: EditTransactionData | null;
  // Label of the trigger button in uncontrolled mode.
  triggerLabel?: string;
}

function LogTransactionForm({
  editData,
  onClose,
}: {
  editData?: EditTransactionData | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditMode = !!editData;

  // Form state is seeded from editData on mount. The parent remounts this
  // component (via key) whenever the dialog opens, so no sync effect is needed.
  const [type, setType] = useState<"BUY" | "SELL">(editData?.type ?? "BUY");
  const [selectedAsset, setSelectedAsset] = useState<{
    ticker: string;
    companyName: string;
  } | null>(
    editData
      ? { ticker: editData.ticker, companyName: editData.companyName }
      : null
  );
  const [inputMode, setInputMode] = useState<"shares" | "dollars">("shares");
  const [amount, setAmount] = useState(editData ? String(editData.quantity) : "");
  const [pricePerShare, setPricePerShare] = useState(
    editData ? String(editData.pricePerShare) : ""
  );
  const [fee, setFee] = useState(
    editData?.totalFees ? String(editData.totalFees) : ""
  );
  const [date, setDate] = useState(() =>
    editData
      ? new Date(editData.executedAt).toISOString().slice(0, 10)
      : toDateInputValue(new Date())
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const parsedPrice = parseFloat(pricePerShare) || 0;
  const parsedFee = parseFloat(fee) || 0;

  const derivedShares =
    inputMode === "dollars" && parsedPrice > 0
      ? parsedAmount / parsedPrice
      : parsedAmount;
  const subtotal = derivedShares * parsedPrice;
  const netTotal =
    type === "BUY" ? subtotal + parsedFee : subtotal - parsedFee;

  // Display only; the server derives the asset's currency from the ticker.
  const currency = selectedAsset ? currencyForTicker(selectedAsset.ticker) : "USD";
  const moneySymbol = currency === "IDR" ? "Rp" : "$";
  const moneyInputPadding = currency === "IDR" ? "pl-9" : "pl-7";

  async function handleSubmit() {
    if (!selectedAsset || parsedAmount <= 0 || parsedPrice <= 0) return;

    setStatus("loading");
    const input: LogTransactionInput = {
      ticker: selectedAsset.ticker,
      companyName: selectedAsset.companyName,
      type,
      inputMode,
      amount: parsedAmount,
      pricePerShare: parsedPrice,
      fee: parsedFee,
      date,
    };

    try {
      const res = isEditMode
        ? await updateTransaction(editData!.id, input)
        : await createManualTransaction(input);

      if (res.success) {
        setStatus("success");
        setStatusMsg(res.message);
        router.refresh();
        setTimeout(() => onClose(), 1200);
      } else {
        setStatus("error");
        setStatusMsg(res.message);
      }
    } catch {
      setStatus("error");
      setStatusMsg("Something went wrong. Please try again.");
    }
  }

  const canSubmit =
    !!selectedAsset && parsedAmount > 0 && parsedPrice > 0 && status !== "loading";

  const segment = (active: boolean) =>
    cn(
      "flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold transition-colors",
      active ? "bg-layer-3 text-fg-1" : "text-fg-4 hover:bg-hover hover:text-fg-2"
    );

  return (
    <>
      <AppDialogBody scroll={false} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Transaction type</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={type === "BUY"}
              onClick={() => setType("BUY")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-colors",
                type === "BUY" ? "border-gain/60 bg-gain-wash text-gain" : "border-line text-fg-4 hover:bg-hover hover:text-fg-2"
              )}
            >
              <ArrowDownLeft className="size-3.5" strokeWidth={2} />
              Buy
            </button>
            <button
              type="button"
              aria-pressed={type === "SELL"}
              onClick={() => setType("SELL")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-colors",
                type === "SELL" ? "border-loss/60 bg-loss-wash text-loss" : "border-line text-fg-4 hover:bg-hover hover:text-fg-2"
              )}
            >
              <ArrowUpRight className="size-3.5" strokeWidth={2} />
              Sell
            </button>
          </div>
        </div>

        <TickerSearch value={selectedAsset} onChange={setSelectedAsset} />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="amount-input" className={fieldLabel}>
              Amount
            </label>
            <div className="flex overflow-hidden rounded-md border border-line">
              <button type="button" aria-pressed={inputMode === "shares"} onClick={() => setInputMode("shares")} className={segment(inputMode === "shares")}>
                <Hash className="size-3" />
                Shares
              </button>
              <button type="button" aria-pressed={inputMode === "dollars"} onClick={() => setInputMode("dollars")} className={segment(inputMode === "dollars")}>
                {currency === "IDR" ? <Banknote className="size-3" /> : <DollarSign className="size-3" />}
                {currency === "IDR" ? "Rupiah" : "Dollars"}
              </button>
            </div>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
              {inputMode === "shares" ? "#" : moneySymbol}
            </span>
            <input
              id="amount-input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={cn(fieldInput, inputMode === "shares" ? "pl-7" : moneyInputPadding)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price-input" className={fieldLabel}>
              Price / share
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
                {moneySymbol}
              </span>
              <input
                id="price-input"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
                className={cn(fieldInput, moneyInputPadding)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fee-input" className={fieldLabel}>
              Fee (optional)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
                {moneySymbol}
              </span>
              <input
                id="fee-input"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                className={cn(fieldInput, moneyInputPadding)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="date-input" className={fieldLabel}>
            Transaction date
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(fieldInput, "[color-scheme:dark]")}
          />
        </div>

        {parsedAmount > 0 && parsedPrice > 0 && (
          <div className="rounded-lg border border-line-soft bg-sunken px-4 py-3">
            <p className={cn(fieldLabel, "mb-2")}>Order summary</p>
            <div className="flex flex-col gap-1.5 text-[12px] tabular-nums">
              {inputMode === "dollars" && (
                <div className="flex justify-between">
                  <span className="text-fg-4">Derived shares</span>
                  <span className="font-medium text-fg-2">≈ {derivedShares.toFixed(6)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-fg-4">Subtotal</span>
                <span className="font-medium text-fg-2">{formatMoney(subtotal, currency)}</span>
              </div>
              {parsedFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-fg-4">Fee</span>
                  <span className="font-medium text-fg-2">{formatMoney(parsedFee, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-line-soft pt-1.5">
                <span className="font-semibold text-fg-3">Net total</span>
                <span className="font-semibold text-fg-1">{formatMoney(netTotal, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div role="status" className={notice({ tone: "success" })}>
            <CheckCircle2 className="size-3.5 shrink-0" />
            {statusMsg}
          </div>
        )}
        {status === "error" && (
          <div role="alert" className={notice({ tone: "error" })}>
            <XCircle className="size-3.5 shrink-0" />
            {statusMsg}
          </div>
        )}
      </AppDialogBody>

      <AppDialogFooter>
        <AppDialogClose className={appButton({ tone: "secondary" })}>Cancel</AppDialogClose>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={appButton({ tone: type === "BUY" ? "buy" : "sell" })}
        >
          {status === "loading" ? (
            <Loader2 className="animate-spin" />
          ) : type === "BUY" ? (
            <ArrowDownLeft strokeWidth={2} />
          ) : (
            <ArrowUpRight strokeWidth={2} />
          )}
          {isEditMode ? "Save changes" : type === "BUY" ? "Log buy" : "Log sell"}
        </button>
      </AppDialogFooter>
    </>
  );
}

export function LogTransactionDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editData,
  triggerLabel = "Log transaction",
}: LogTransactionDialogProps) {
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  return (
    <AppDialog
      open={open}
      onOpenChange={setOpen}
      title={editData ? "Edit transaction" : "Log transaction"}
      description={editData ? "Change the details of this trade." : "Record a buy or sell by hand."}
      trigger={
        // Only the header button opens it in uncontrolled mode; the table
        // opens it controlled for edits.
        isControlled ? undefined : (
          <button type="button" className={appButton({ tone: "primary" })}>
            <Plus strokeWidth={2.25} />
            {triggerLabel}
          </button>
        )
      }
      onEscapeKeyDown={(event) => {
        // Radix sees Escape before the focused field does. While the ticker
        // list is open, let Escape close the list, not the dialog.
        const target = event.target;
        if (target instanceof HTMLElement && target.getAttribute("aria-expanded") === "true") {
          event.preventDefault();
        }
      }}
    >
      <LogTransactionForm key={editData?.id ?? "new"} editData={editData} onClose={() => setOpen(false)} />
    </AppDialog>
  );
}
