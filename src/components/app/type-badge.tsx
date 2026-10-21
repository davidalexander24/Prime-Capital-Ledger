import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// BUY / SELL marker used by the ledger tables and the import preview.
export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const isBuy = type === "BUY";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.04em]",
        isBuy ? "bg-gain-wash text-gain" : "bg-loss-wash text-loss",
        className
      )}
    >
      {isBuy ? (
        <ArrowDownLeft className="size-3" strokeWidth={2.5} />
      ) : (
        <ArrowUpRight className="size-3" strokeWidth={2.5} />
      )}
      {type}
    </span>
  );
}
