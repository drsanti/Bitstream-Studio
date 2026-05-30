/**
 * Typography + chrome for **`TRNScrubNumberInput`**, **`TRNSelect`** triggers, and aligned text fields.
 * Matches Project 4 **Graphics setup** (`font-sans text-sm font-semibold tracking-wide`, zinc borders).
 */

/** Default under **`TRNSettingRow`** (includes **`mt-1`**). */
export const PANEL_FORM_CONTROL_ROW_CLASS =
  "mt-1 w-full rounded border border-zinc-600/90 bg-zinc-900 px-2 py-2 font-sans text-sm font-semibold tracking-wide text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

/** Same typography without **`mt-1`** (nested label grids, manual connection row). */
export const PANEL_FORM_CONTROL_COMPACT_CLASS =
  "w-full rounded border border-zinc-600/90 bg-zinc-900 px-2 py-2 font-sans text-sm font-semibold tracking-wide text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";
