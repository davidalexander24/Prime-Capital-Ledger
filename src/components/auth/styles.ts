import { cn } from "@/lib/utils";
import { appButton } from "@/components/app/styles";

// Auth forms use the app palette at a slightly larger size than dashboard
// forms, with one radius for inputs and buttons.

export const authLabel = "mb-1.5 block text-[13px] font-medium text-fg-3";

export const authInput =
  "h-11 w-full rounded-lg border border-field bg-sunken px-3.5 text-[14px] text-fg-1 placeholder:text-fg-5 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-50";

export const authSubmit = cn(appButton({ tone: "primary" }), "h-11 w-full text-[14px] aria-busy:cursor-progress aria-busy:opacity-85");

export const authSwitchText = "mt-5 text-center text-[13px] text-fg-4 [&_a]:font-semibold [&_a]:text-brand [&_a:hover]:underline";
