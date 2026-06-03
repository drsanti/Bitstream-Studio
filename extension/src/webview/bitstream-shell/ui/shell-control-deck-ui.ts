/** Shared chrome for the shell center control deck (workspace · data source · service). */

/**
 * Deck pill labels use `@[1101px]/bitstream-toolbar` on the header
 * (`@container/bitstream-toolbar`). Width ≤1100px: icon-only; width >1100px: show text.
 */

/** Single-row deck — zone labels are `aria-label` only. */
export const SHELL_CONTROL_DECK_CLASS =
  "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/40 px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] @[1101px]/bitstream-toolbar:gap-2";

export const SHELL_CONTROL_DECK_DIVIDER_CLASS = "h-3.5 w-px shrink-0 bg-zinc-700/80";

export const SHELL_CONTROL_DECK_ZONE_CLASS = "inline-flex min-w-0 flex-nowrap items-center gap-0.5";

/** Inactive segment — faint chrome; hover glow comes from `shell-control-deck.css`. */
export const SHELL_DECK_PILL_INACTIVE_CLASS =
  "inline-flex h-6 w-8 shrink-0 items-center justify-center gap-0 rounded-full border border-zinc-700/55 bg-zinc-800/30 px-1.5 text-[10px] font-medium tracking-wide text-zinc-500 hover:bg-zinc-800/55 hover:text-zinc-200 @[1101px]/bitstream-toolbar:w-auto @[1101px]/bitstream-toolbar:justify-start @[1101px]/bitstream-toolbar:gap-1 @[1101px]/bitstream-toolbar:px-2.5";

/** Active segment base — pair with workspace/source accent classes. */
export const SHELL_DECK_PILL_ACTIVE_BASE_CLASS =
  "inline-flex h-6 w-8 shrink-0 items-center justify-center gap-0 rounded-full border px-1.5 text-[10px] font-medium tracking-wide transition-colors @[1101px]/bitstream-toolbar:w-auto @[1101px]/bitstream-toolbar:justify-start @[1101px]/bitstream-toolbar:gap-1 @[1101px]/bitstream-toolbar:px-2.5";

/** Service connect chip — fixed width when labeled; square icon-only when deck column is narrow. */
export const SHELL_SERVICE_LINK_CHIP_CLASS = `${SHELL_DECK_PILL_ACTIVE_BASE_CLASS} w-8 shrink-0 justify-center gap-0 px-0 @[1101px]/bitstream-toolbar:w-[6.75rem] @[1101px]/bitstream-toolbar:justify-center @[1101px]/bitstream-toolbar:gap-1.5 @[1101px]/bitstream-toolbar:px-2.5`;

/** Deck pill text — hidden until deck column is wide enough; tooltips / aria keep labels. */
export const SHELL_DECK_PILL_LABEL_CLASS = "hidden @[1101px]/bitstream-toolbar:inline";
