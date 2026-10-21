"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  DollarSign,
  Banknote,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  createManualTransaction,
  updateTransaction,
  type LogTransactionInput,
} from "@/app/actions/logTransaction";
import { currencyForTicker } from "@/lib/currency";
import { formatMoney, toDateInputValue } from "@/lib/format";
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
        <div>
          <Dialog.Title className="text-sm font-semibold text-fg-1">
            {isEditMode ? "Edit Transaction" : "Log Transaction"}
          </Dialog.Title>
          <Dialog.Description className="mt-0.5 text-[11px] text-fg-4">
            {isEditMode
              ? "Modify the details of this transaction."
              : "Manually record a buy or sell order."}
          </Dialog.Description>
        </div>
        <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-layer-1 hover:text-fg-3">
          <X className="h-4 w-4" />
        </Dialog.Close>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-6 py-5">
        {/* Transaction Type */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-4">
            Transaction Type
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("BUY")}
              className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-all ${
                type === "BUY"
                  ? "border-gain/60 bg-gain-wash text-gain"
                  : "border-line text-fg-4 hover:bg-hover"
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType("SELL")}
              className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-all ${
                type === "SELL"
                  ? "border-loss/60 bg-loss-wash text-loss"
                  : "border-line text-fg-4 hover:bg-hover"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              Sell
            </button>
          </div>
        </div>

        {/* Asset Search */}
        <TickerSearch value={selectedAsset} onChange={setSelectedAsset} />

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-4">
              Amount
            </span>
            <div className="flex overflow-hidden rounded-md border border-line">
              <button
                type="button"
                onClick={() => setInputMode("shares")}
                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold transition-colors ${
                  inputMode === "shares"
                    ? "bg-layer-3 text-fg-2"
                    : "text-fg-5 hover:bg-hover"
                }`}
              >
                <Hash className="h-2.5 w-2.5" />
                Shares
              </button>
              <button
                type="button"
                onClick={() => setInputMode("dollars")}
                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold transition-colors ${
                  inputMode === "dollars"
                    ? "bg-layer-3 text-fg-2"
                    : "text-fg-5 hover:bg-hover"
                }`}
              >
                {currency === "IDR" ? (
                  <Banknote className="h-2.5 w-2.5" />
                ) : (
                  <DollarSign className="h-2.5 w-2.5" />
                )}
                {currency === "IDR" ? "Rupiah" : "Dollars"}
              </button>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
              {inputMode === "shares" ? "#" : moneySymbol}
            </span>
            <input
              id="amount-input"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`h-9 w-full rounded-lg border border-line bg-sunken ${inputMode === "shares" ? "pl-7" : moneyInputPadding} pr-3 text-[13px] font-medium text-fg-1 placeholder:text-fg-5 outline-none transition-colors focus:border-brand`}
            />
          </div>
        </div>

        {/* Price + Fee */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-4">
              Price / Share
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
                {moneySymbol}
              </span>
              <input
                id="price-input"
                type="number"
                step="any"
                min="0"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
                className={`h-9 w-full rounded-lg border border-line bg-sunken ${moneyInputPadding} pr-3 text-[13px] font-medium text-fg-1 placeholder:text-fg-5 outline-none transition-colors focus:border-brand`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-4">
              Fee (optional)
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-5">
                {moneySymbol}
              </span>
              <input
                id="fee-input"
                type="number"
                step="any"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                className={`h-9 w-full rounded-lg border border-line bg-sunken ${moneyInputPadding} pr-3 text-[13px] font-medium text-fg-1 placeholder:text-fg-5 outline-none transition-colors focus:border-brand`}
              />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-4">
            Transaction Date
          </span>
          <div className="relative">
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-sunken px-3 text-[13px] font-medium text-fg-1 outline-none transition-colors focus:border-brand [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Order summary (visible when values are filled) */}
        {parsedAmount > 0 && parsedPrice > 0 && (
          <div className="rounded-lg border border-line-soft bg-sunken px-4 py-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-fg-4">
              Order Summary
            </p>
            <div className="flex flex-col gap-1.5 text-[11px]">
              {inputMode === "dollars" && (
                <div className="flex justify-between">
                  <span className="text-fg-4">
                    Derived Shares
                  </span>
                  <span className="font-medium text-fg-2">
                    ≈ {derivedShares.toFixed(6)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-fg-4">Subtotal</span>
                <span className="font-medium text-fg-2">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              {parsedFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-fg-4">Fee</span>
                  <span className="font-medium text-fg-2">
                    {formatMoney(parsedFee, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-line-soft pt-1.5">
                <span className="font-semibold text-fg-4">
                  Net Total
                </span>
                <span className="font-semibold text-fg-1">
                  {formatMoney(netTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-gain-wash px-3 py-2 text-[11px] text-gain">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {statusMsg}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-loss-wash px-3 py-2 text-[11px] text-loss">
            <XCircle className="h-3.5 w-3.5" />
            {statusMsg}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-line-soft px-6 py-4">
        <Dialog.Close className="flex h-9 items-center rounded-lg border border-line px-4 text-[12px] font-medium text-fg-3 transition-colors hover:bg-hover">
          Cancel
        </Dialog.Close>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex h-9 items-center gap-2 rounded-lg px-5 text-[12px] font-semibold transition-all ${
            canSubmit
              ? type === "BUY"
                ? "bg-gain-solid text-fg-1 hover:bg-gain-solid-hover"
                : "bg-loss-solid text-fg-1 hover:bg-loss-solid-hover"
              : "cursor-not-allowed bg-layer-2 text-fg-5"
          }`}
        >
          {status === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : type === "BUY" ? (
            <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {isEditMode
            ? "Save Changes"
            : type === "BUY"
            ? "Log Buy"
            : "Log Sell"}
        </button>
      </div>
    </>
  );
}

export function LogTransactionDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editData,
}: LogTransactionDialogProps) {
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Only show trigger in non-controlled mode (new transaction from header) */}
      {!isControlled && (
        <Dialog.Trigger asChild>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12px] font-semibold text-canvas transition-colors hover:bg-brand-hover">
            <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Log Transaction
          </button>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            // Radix sees Escape before the focused field does. While the
            // ticker list is open, let Escape close the list, not the dialog.
            const target = event.target;
            if (target instanceof HTMLElement && target.getAttribute("aria-expanded") === "true") {
              event.preventDefault();
            }
          }}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <LogTransactionForm
            key={editData?.id ?? "new"}
            editData={editData}
            onClose={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
