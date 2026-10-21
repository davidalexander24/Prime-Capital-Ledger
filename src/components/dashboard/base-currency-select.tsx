"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBaseCurrency } from "@/app/actions/settings";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldInput } from "@/components/app/styles";

export function BaseCurrencySelect({ id, initialValue }: { id?: string; initialValue: string }) {
  const router = useRouter();
  // Local state so the select shows the new choice right away instead of
  // snapping back to the server value until the refresh lands.
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const previous = value;
    const newCurrency = e.target.value;
    setValue(newCurrency);
    setLoading(true);
    setError(null);
    try {
      const res = await updateBaseCurrency(newCurrency);
      if (res.success) {
        router.refresh();
      } else {
        setValue(previous);
        setError(res.message ?? "Failed to update.");
      }
    } catch {
      setValue(previous);
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="size-3.5 animate-spin text-fg-4" />}
      {error && (
        <span role="alert" className="text-[12px] text-loss">
          {error}
        </span>
      )}
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={loading}
        className={cn(fieldInput, "h-8 w-auto pr-8 pl-2.5 text-[12px] [color-scheme:dark]")}
      >
        <option value="IDR">IDR</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
}
