"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  DollarSign,
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
  currency: string;
}

interface LogTransactionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editData?: EditTransactionData | null;
}

export function LogTransactionDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editData,
}: LogTransactionDialogProps) {
  const router = useRouter();
  const isEditMode = !!editData;
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  // Form state
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [selectedAsset, setSelectedAsset] = useState<{
    ticker: string;
    companyName: string;
  } | null>(null);
  const [inputMode, setInputMode] = useState<"shares" | "dollars">("shares");
  const [amount, setAmount] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [fee, setFee] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (open) {
      if (editData) {
        setType(editData.type);
        setSelectedAsset({
          ticker: editData.ticker,
          companyName: editData.companyName,
        });
        setInputMode("shares");
        setAmount(String(editData.quantity));
        setPricePerShare(String(editData.pricePerShare));
        setFee(editData.totalFees ? String(editData.totalFees) : "");
        setDate(new Date(editData.executedAt).toISOString().slice(0, 10));
      } else {
        setType("BUY");
        setSelectedAsset(null);
        setInputMode("shares");
        setAmount("");
        setPricePerShare("");
        setFee("");
        setDate(new Date().toISOString().slice(0, 10));
      }
      setStatus("idle");
      setStatusMsg("");
    }
  }, [open, editData]);

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
      currency: editData?.currency || "USD",
    };

    const res = isEditMode
      ? await updateTransaction(editData!.id, input)
      : await createManualTransaction(input);

    if (res.success) {
      setStatus("success");
      setStatusMsg(res.message);
      router.refresh();
      setTimeout(() => setOpen(false), 1200);
    } else {
      setStatus("error");
      setStatusMsg(res.message);
    }
  }

  const canSubmit =
    !!selectedAsset && parsedAmount > 0 && parsedPrice > 0 && status !== "loading";

  const dialogContent = (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[oklch(0.12_0.005_260)] px-6 py-4">
          <div>
            <Dialog.Title className="text-sm font-semibold text-[oklch(0.90_0.005_260)]">
              {isEditMode ? "Edit Transaction" : "Log Transaction"}
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-[11px] text-[oklch(0.40_0.01_260)]">
              {isEditMode
                ? "Modify the details of this transaction."
                : "Manually record a buy or sell order."}
            </Dialog.Description>
          </div>
          <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-md text-[oklch(0.45_0.01_260)] transition-colors hover:bg-[oklch(0.10_0.005_260)] hover:text-[oklch(0.70_0.005_260)]">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Transaction Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Transaction Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("BUY")}
                className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-all ${
                  type === "BUY"
                    ? "border-[oklch(0.45_0.15_155)] bg-[oklch(0.18_0.06_155)] text-[oklch(0.75_0.14_155)]"
                    : "border-[oklch(0.14_0.005_260)] text-[oklch(0.40_0.01_260)] hover:bg-[oklch(0.08_0.005_260)]"
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
                    ? "border-[oklch(0.45_0.12_25)] bg-[oklch(0.18_0.06_25)] text-[oklch(0.75_0.12_25)]"
                    : "border-[oklch(0.14_0.005_260)] text-[oklch(0.40_0.01_260)] hover:bg-[oklch(0.08_0.005_260)]"
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
                Amount
              </span>
              <div className="flex overflow-hidden rounded-md border border-[oklch(0.14_0.005_260)]">
                <button
                  type="button"
                  onClick={() => setInputMode("shares")}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold transition-colors ${
                    inputMode === "shares"
                      ? "bg-[oklch(0.14_0.005_260)] text-[oklch(0.80_0.005_260)]"
                      : "text-[oklch(0.35_0.01_260)] hover:bg-[oklch(0.08_0.005_260)]"
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
                      ? "bg-[oklch(0.14_0.005_260)] text-[oklch(0.80_0.005_260)]"
                      : "text-[oklch(0.35_0.01_260)] hover:bg-[oklch(0.08_0.005_260)]"
                  }`}
                >
                  <DollarSign className="h-2.5 w-2.5" />
                  Dollars
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[oklch(0.30_0.01_260)]">
                {inputMode === "shares" ? "#" : "$"}
              </span>
              <input
                id="amount-input"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 w-full rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] pl-7 pr-3 text-[13px] font-medium text-[oklch(0.90_0.005_260)] placeholder:text-[oklch(0.25_0.01_260)] outline-none transition-colors focus:border-[oklch(0.70_0.08_230)]"
              />
            </div>
          </div>

          {/* Price + Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
                Price / Share
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[oklch(0.30_0.01_260)]">
                  $
                </span>
                <input
                  id="price-input"
                  type="number"
                  step="any"
                  min="0"
                  value={pricePerShare}
                  onChange={(e) => setPricePerShare(e.target.value)}
                  placeholder="0.00"
                  className="h-9 w-full rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] pl-7 pr-3 text-[13px] font-medium text-[oklch(0.90_0.005_260)] placeholder:text-[oklch(0.25_0.01_260)] outline-none transition-colors focus:border-[oklch(0.70_0.08_230)]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
                Fee (optional)
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[oklch(0.30_0.01_260)]">
                  $
                </span>
                <input
                  id="fee-input"
                  type="number"
                  step="any"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00"
                  className="h-9 w-full rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] pl-7 pr-3 text-[13px] font-medium text-[oklch(0.90_0.005_260)] placeholder:text-[oklch(0.25_0.01_260)] outline-none transition-colors focus:border-[oklch(0.70_0.08_230)]"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
              Transaction Date
            </span>
            <div className="relative">
              <input
                id="date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] px-3 text-[13px] font-medium text-[oklch(0.90_0.005_260)] outline-none transition-colors focus:border-[oklch(0.70_0.08_230)] [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Order summary (visible when values are filled) */}
          {parsedAmount > 0 && parsedPrice > 0 && (
            <div className="rounded-lg border border-[oklch(0.12_0.005_260)] bg-[oklch(0.03_0.005_260)] px-4 py-3">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
                Order Summary
              </p>
              <div className="flex flex-col gap-1.5 text-[11px]">
                {inputMode === "dollars" && (
                  <div className="flex justify-between">
                    <span className="text-[oklch(0.45_0.01_260)]">
                      Derived Shares
                    </span>
                    <span className="font-medium text-[oklch(0.75_0.005_260)]">
                      ≈ {derivedShares.toFixed(6)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[oklch(0.45_0.01_260)]">Subtotal</span>
                  <span className="font-medium text-[oklch(0.75_0.005_260)]">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                {parsedFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[oklch(0.45_0.01_260)]">Fee</span>
                    <span className="font-medium text-[oklch(0.75_0.005_260)]">
                      ${parsedFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[oklch(0.10_0.005_260)] pt-1.5">
                  <span className="font-semibold text-[oklch(0.50_0.01_260)]">
                    Net Total
                  </span>
                  <span className="font-semibold text-[oklch(0.90_0.005_260)]">
                    ${netTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {status === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.15_0.05_155)] px-3 py-2 text-[11px] text-[oklch(0.70_0.12_155)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {statusMsg}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.15_0.05_25)] px-3 py-2 text-[11px] text-[oklch(0.70_0.12_25)]">
              <XCircle className="h-3.5 w-3.5" />
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[oklch(0.12_0.005_260)] px-6 py-4">
          <Dialog.Close className="flex h-9 items-center rounded-lg border border-[oklch(0.14_0.005_260)] px-4 text-[12px] font-medium text-[oklch(0.60_0.005_260)] transition-colors hover:bg-[oklch(0.08_0.005_260)]">
            Cancel
          </Dialog.Close>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex h-9 items-center gap-2 rounded-lg px-5 text-[12px] font-semibold transition-all ${
              canSubmit
                ? type === "BUY"
                  ? "bg-[oklch(0.40_0.12_155)] text-[oklch(0.95_0.01_155)] hover:bg-[oklch(0.45_0.13_155)]"
                  : "bg-[oklch(0.40_0.12_25)] text-[oklch(0.95_0.01_25)] hover:bg-[oklch(0.45_0.13_25)]"
                : "cursor-not-allowed bg-[oklch(0.12_0.005_260)] text-[oklch(0.30_0.005_260)]"
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
      </Dialog.Content>
    </Dialog.Portal>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Only show trigger in non-controlled mode (new transaction from header) */}
      {!isControlled && (
        <Dialog.Trigger asChild>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-[oklch(0.70_0.08_230)] px-4 text-[12px] font-semibold text-[oklch(0.05_0.005_260)] transition-colors hover:bg-[oklch(0.75_0.09_230)]">
            <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Log Transaction
          </button>
        </Dialog.Trigger>
      )}
      {dialogContent}
    </Dialog.Root>
  );
}
