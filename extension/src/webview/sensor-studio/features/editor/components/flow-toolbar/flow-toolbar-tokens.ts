import { twMerge } from "tailwind-merge";

export const FLOW_TOOLBAR_PILL_CLASS =
  "nodrag nowheel pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-600/80 bg-zinc-950/90 p-1 shadow-lg backdrop-blur-sm";

export const FLOW_TOOLBAR_BTN_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-95";

export const FLOW_TOOLBAR_DIVIDER_CLASS = "mx-0.5 h-4 w-px shrink-0 bg-zinc-600/60";

export function flowToolbarBtnClass(disabled?: boolean): string {
  return twMerge(FLOW_TOOLBAR_BTN_CLASS, disabled && "pointer-events-none opacity-40");
}

export function flowToolbarDangerBtnClass(): string {
  return twMerge(
    FLOW_TOOLBAR_BTN_CLASS,
    "text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400",
  );
}
