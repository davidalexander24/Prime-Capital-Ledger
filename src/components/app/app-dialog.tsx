"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDTHS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
};

interface AppDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  size?: keyof typeof WIDTHS;
  // Blocks closing (overlay click, Escape, the close button) while busy.
  locked?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  children?: React.ReactNode;
}

// The one dialog shell for the dashboard: overlay, card surface and a header
// with a labelled close button. Content goes in AppDialogBody and
// AppDialogFooter.
export function AppDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  size = "md",
  locked = false,
  onEscapeKeyDown,
  children,
}: AppDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => (locked ? undefined : onOpenChange?.(next))}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (locked) event.preventDefault();
            onEscapeKeyDown?.(event);
          }}
          className={cn(
            "surface-card fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            WIDTHS[size]
          )}
        >
          {/* Body and footer draw the dividers, so a dialog without a body gets one line, not two. */}
          <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
            {icon}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-sm font-semibold text-fg-1">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-[12px] leading-relaxed text-fg-4">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              disabled={locked}
              aria-label="Close"
              className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-hover hover:text-fg-1 disabled:opacity-50"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Scrolls when the dialog is taller than the screen. Pass scroll={false} when
// the body holds an absolutely positioned popup (the ticker list), which a
// scroll container would clip.
export function AppDialogBody({
  className,
  scroll = true,
  children,
}: {
  className?: string;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-t border-line-soft px-5 py-5 sm:px-6",
        scroll && "max-h-[calc(100dvh-12rem)] overflow-y-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AppDialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line-soft px-5 py-4 sm:px-6">{children}</div>
  );
}

export const AppDialogClose = DialogPrimitive.Close;
