"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBaseCurrency } from "@/app/actions/settings";
import { Loader2 } from "lucide-react";

export function BaseCurrencySelect({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true);
    const newCurrency = e.target.value;
    const res = await updateBaseCurrency(newCurrency);
    if (res.success) {
      router.refresh();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.40_0.01_260)]" />}
      <select
        value={initialValue}
        onChange={handleChange}
        disabled={loading}
        className="h-8 rounded-md border border-[oklch(0.14_0.005_260)] bg-[oklch(0.06_0.005_260)] px-2 text-[12px] font-medium text-[oklch(0.80_0.005_260)] outline-none transition-colors focus:border-[oklch(0.25_0.01_260)] disabled:opacity-50"
      >
        <option value="IDR">IDR</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
}
