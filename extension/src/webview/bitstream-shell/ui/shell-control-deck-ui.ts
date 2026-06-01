/** Shared chrome for the shell center control deck (workspace · data source · service). */

/** Single-row deck — zone labels are `aria-label` only. */
export const SHELL_CONTROL_DECK_CLASS =
  "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/40 px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const SHELL_CONTROL_DECK_DIVIDER_CLASS = "h-3.5 w-px shrink-0 bg-zinc-700/80";

export const SHELL_CONTROL_DECK_ZONE_CLASS = "inline-flex min-w-0 flex-nowrap items-center gap-0.5";

/** Inactive segment — faint chrome; hover glow comes from `shell-control-deck.css`. */
export const SHELL_DECK_PILL_INACTIVE_CLASS =
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-zinc-700/55 bg-zinc-800/30 px-2.5 text-[10px] font-medium tracking-wide text-zinc-500 hover:bg-zinc-800/55 hover:text-zinc-200";

/** Active segment base — pair with workspace/source accent classes. */
export const SHELL_DECK_PILL_ACTIVE_BASE_CLASS =
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[10px] font-medium tracking-wide transition-colors";

/** Service connect chip — fixed width so Connect / Disconnect / Connecting… do not shift layout. */
export const SHELL_SERVICE_LINK_CHIP_CLASS = `${SHELL_DECK_PILL_ACTIVE_BASE_CLASS} w-[6.75rem] shrink-0 justify-center gap-1.5`;
