export type TRNScrubFieldBadgeTone =
  | "violet"
  | "amber"
  | "rose"
  | "emerald"
  | "sky"
  | "neutral"
  | "custom";

export const TRN_SCRUB_FIELD_BADGE_TONE_CLASS: Record<
  Exclude<TRNScrubFieldBadgeTone, "custom">,
  string
> = {
  violet: "border-violet-500/70 text-violet-200",
  amber: "border-amber-500/70 text-amber-200",
  rose: "border-rose-500/70 text-rose-200",
  emerald: "border-emerald-500/70 text-emerald-200",
  sky: "border-sky-500/70 text-sky-200",
  neutral: "border-zinc-600/80 text-zinc-300",
};
