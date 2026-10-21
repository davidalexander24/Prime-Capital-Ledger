"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { applyStockSplit } from "@/app/actions/portfolio";

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
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="ml-2 inline-flex items-center gap-1 rounded bg-layer-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-fg-4 hover:bg-layer-3 hover:text-fg-2 transition-colors"
        title="Apply Stock Split"
      >
        <Scissors className="h-2.5 w-2.5" />
        Split
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl border border-line-strong bg-layer-1 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-fg-1">Apply Stock Split</h3>
            <p className="mt-1 text-sm text-fg-3">
              Adjust historical transactions for {ticker.replace(".JK", "")}.
            </p>
            
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="split-ratio" className="text-xs font-medium text-fg-3">Split Ratio (e.g. 8 for 8:1)</label>
                <input
                  id="split-ratio"
                  type="number"
                  step="0.001"
                  value={ratio}
                  onChange={e => setRatio(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-fg-1 focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="split-date" className="text-xs font-medium text-fg-3">Effective Date</label>
                <input
                  id="split-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-fg-1 focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-fg-4">Transactions strictly before this date will be adjusted.</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-loss/40 bg-loss-wash px-3 py-2 text-[11px] text-loss">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-fg-3 hover:text-fg-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleSplit}
                disabled={loading}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand disabled:opacity-50"
              >
                {loading ? "Applying..." : "Apply Split"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
