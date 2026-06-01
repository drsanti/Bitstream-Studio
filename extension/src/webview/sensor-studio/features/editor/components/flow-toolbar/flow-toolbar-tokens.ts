import { twMerge } from "tailwind-merge";

export const FLOW_TOOLBAR_PILL_CLASS =
  "nodrag nowheel pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/10 bg-zinc-950/55 p-1 shadow-lg shadow-black/30 ring-1 ring-white/5 backdrop-blur-md";

export const FLOW_TOOLBAR_BTN_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-95";

/** Canvas chrome (FPS row + Studio menu) — icon only, no pill frame. */
export const FLOW_CANVAS_CHROME_BTN_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-zinc-400 shadow-none transition-colors hover:bg-zinc-800/50 hover:text-zinc-100 active:scale-95";

export const FLOW_TOOLBAR_DIVIDER_CLASS = "mx-0.5 h-4 w-px shrink-0 bg-zinc-600/60";

export function flowToolbarBtnClass(disabled?: boolean, active?: boolean): string {
  return twMerge(
    FLOW_TOOLBAR_BTN_CLASS,
    active && "bg-cyan-950/45 text-cyan-100 ring-1 ring-cyan-500/35",
    disabled && "pointer-events-none opacity-40",
  );
}

export function flowToolbarDangerBtnClass(): string {
  return twMerge(
    FLOW_TOOLBAR_BTN_CLASS,
    "text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400",
  );
}
