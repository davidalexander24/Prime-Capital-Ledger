"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBaseCurrency } from "@/app/actions/settings";
import { Loader2 } from "lucide-react";

export function BaseCurrencySelect({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    setError(null);
    const newCurrency = e.target.value;
    try {
      const res = await updateBaseCurrency(newCurrency);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.message ?? "Failed to update.");
      }
    } catch {
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-4" />}
      {error && (
        <span className="text-[11px] text-loss">{error}</span>
      )}
      <select
        value={initialValue}
        onChange={handleChange}
        disabled={loading}
        className="h-8 rounded-md border border-line bg-raised px-2 text-[12px] font-medium text-fg-2 outline-none transition-colors focus:border-line-strong disabled:opacity-50"
      >
        <option value="IDR">IDR</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
}
