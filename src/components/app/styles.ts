import { cva } from "class-variance-authority";

// Shared control styles for the dashboard, so buttons, fields and labels look
// the same in every page and dialog.

export const appButton = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        primary: "bg-brand text-canvas hover:bg-brand-hover",
        secondary: "border border-line-strong text-fg-2 hover:bg-hover hover:text-fg-1",
        ghost: "text-fg-3 hover:bg-hover hover:text-fg-1",
        buy: "bg-gain-solid text-fg-1 hover:bg-gain-solid-hover",
        sell: "bg-loss-solid text-fg-1 hover:bg-loss-solid-hover",
        danger: "border border-loss/40 text-loss hover:bg-loss-wash",
      },
      size: {
        md: "h-9 px-4 text-[12px]",
        sm: "h-8 px-3 text-[12px]",
        icon: "size-8 text-[12px]",
      },
    },
    defaultVariants: { tone: "primary", size: "md" },
  }
);

export const fieldLabel = "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-4";

export const fieldInput =
  "h-9 w-full rounded-lg border border-field bg-sunken px-3 text-[13px] font-medium text-fg-1 placeholder:text-fg-5 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-50";

// Desktop tables hide the row menu until the row is hovered, but only where
// there is a mouse; touch screens keep it visible. Lives here, not in the
// client-only row-menu module, so server components can import the string.
export const rowMenuReveal =
  "pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100";

// Small status message under a form: success or error.
export const notice = cva("flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]", {
  variants: {
    tone: {
      success: "bg-gain-wash text-gain",
      error: "bg-loss-wash text-loss",
    },
  },
});
