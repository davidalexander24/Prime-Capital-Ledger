"use client";

import { DropdownMenu } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// The "..." menu at the end of a table row or mobile card.
export function RowMenu({
  label = "Row actions",
  className,
  ref,
  children,
}: {
  label?: string;
  className?: string;
  // The trigger button; a dialog opened from the menu returns focus to it.
  ref?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-layer-1 hover:text-fg-1 data-[state=open]:bg-layer-1 data-[state=open]:text-fg-1",
            className
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 min-w-40 overflow-hidden rounded-lg border border-line-strong bg-raised p-1 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function RowMenuItem({
  icon,
  tone = "default",
  onSelect,
  children,
}: {
  icon?: React.ReactNode;
  tone?: "default" | "danger";
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium outline-none transition-colors [&_svg]:size-3.5",
        tone === "danger"
          ? "text-loss data-highlighted:bg-loss-wash"
          : "text-fg-2 data-highlighted:bg-hover data-highlighted:text-fg-1"
      )}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
