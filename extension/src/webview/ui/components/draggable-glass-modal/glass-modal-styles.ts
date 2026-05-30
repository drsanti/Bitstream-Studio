import { twMerge } from "tailwind-merge";

/** Outer shell: translucent dark glass, no stroke (see-through). */
export const shellGlass = twMerge(
  "pointer-events-auto isolate select-none touch-none",
  "!overflow-hidden !rounded-lg !border-0 !shadow-xl !backdrop-blur-2xl !text-zinc-100",
  "!bg-[linear-gradient(180deg,rgba(63,63,70,0.06)_0%,transparent_45%),linear-gradient(155deg,rgba(24,24,27,0.45)_0%,rgba(12,12,14,0.38)_50%,rgba(9,9,11,0.42)_100%)]",
  "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]",
);

/** Header strip: light tint only (no border). */
export const titleBarClass = twMerge(
  "relative z-1 flex shrink-0 items-center justify-between bg-zinc-950/25 px-2 py-1",
);

/** Title string in the header. */
export const titleTextClass = "text-base font-medium text-zinc-100";
