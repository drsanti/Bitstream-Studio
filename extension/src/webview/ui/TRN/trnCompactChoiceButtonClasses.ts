/** Shared compact choice-button chrome — `TRNButton` compact + `TRNChipButtonGroup` sm. */
export const TRN_COMPACT_CHOICE_BUTTON_BASE =
  "inline-flex items-center justify-center rounded-sm border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50";

export const TRN_COMPACT_CHOICE_BUTTON_SIZE = "h-6 min-w-10 px-2 text-xs font-medium";

export function trnCompactChoiceButtonTone(selected: boolean, disabled: boolean): string
{
  if (disabled)
  {
    return "border-zinc-800/80 bg-zinc-950/60 text-zinc-600 opacity-60";
  }
  if (selected)
  {
    return "border-zinc-700/80 bg-cyan-500/20 text-cyan-100";
  }
  return "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75";
}
