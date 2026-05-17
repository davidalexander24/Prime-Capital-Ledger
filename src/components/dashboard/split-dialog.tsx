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

  async function handleSplit() {
    if (!ratio || !date) return;
    setLoading(true);
    const r = parseFloat(ratio);
    const res = await applyStockSplit(ticker, r, date);
    setLoading(false);
    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-2 inline-flex items-center gap-1 rounded bg-[oklch(0.12_0.005_260)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.50_0.01_260)] hover:bg-[oklch(0.20_0.005_260)] hover:text-[oklch(0.80_0.01_260)] transition-colors"
        title="Apply Stock Split"
      >
        <Scissors className="h-2.5 w-2.5" />
        Split
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl border border-[oklch(0.20_0.005_260)] bg-[oklch(0.10_0.005_260)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[oklch(0.93_0.005_260)]">Apply Stock Split</h3>
            <p className="mt-1 text-sm text-[oklch(0.55_0.01_260)]">
              Adjust historical transactions for {ticker.replace(".JK", "")}.
            </p>
            
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-[oklch(0.70_0.01_260)]">Split Ratio (e.g. 8 for 8:1)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={ratio} 
                  onChange={e => setRatio(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[oklch(0.20_0.005_260)] bg-[oklch(0.05_0.005_260)] px-3 py-2 text-sm text-[oklch(0.90_0.005_260)] focus:border-[oklch(0.50_0.01_260)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[oklch(0.70_0.01_260)]">Effective Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[oklch(0.20_0.005_260)] bg-[oklch(0.05_0.005_260)] px-3 py-2 text-sm text-[oklch(0.90_0.005_260)] focus:border-[oklch(0.50_0.01_260)] focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-[oklch(0.40_0.01_260)]">Transactions strictly before this date will be adjusted.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[oklch(0.60_0.01_260)] hover:text-[oklch(0.90_0.01_260)]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSplit}
                disabled={loading}
                className="rounded-lg bg-[oklch(0.60_0.10_230)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.55_0.10_230)] disabled:opacity-50"
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
