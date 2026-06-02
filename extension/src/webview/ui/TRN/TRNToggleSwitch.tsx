import { twMerge } from "tailwind-merge";

export type TRNToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  /** Visual size (track + thumb). Defaults to `md`. */
  size?: "sm" | "md" | "lg";
};

const TRACK_BASE_CLASS =
  "relative inline-block shrink-0 rounded-full border border-zinc-700/80 transition-colors disabled:opacity-50";

const THUMB_BASE_CLASS =
  "absolute top-0.5 left-0.5 size-3 rounded-full border border-emerald-300/55 bg-emerald-400/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-150 ease-out";

const SIZE_CLASSES: Record<
  NonNullable<TRNToggleSwitchProps["size"]>,
  { track: string; thumb: string; onTranslateX: string }
> = {
  sm: {
    track: "h-3.5 w-7",
    thumb: "top-px left-px size-2.5",
    onTranslateX: "translate-x-3",
  },
  md: {
    track: "h-4.5 w-8",
    thumb: "top-0.5 left-0.5 size-3",
    // Slightly inset from the right edge for better optical balance.
    onTranslateX: "translate-x-[15px]",
  },
  lg: {
    track: "h-5 w-10",
    thumb: "top-px left-0.5 size-4",
    onTranslateX: "translate-x-5",
  },
};

export function TRNToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
  size = "md",
}: TRNToggleSwitchProps) {
  const s = SIZE_CLASSES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return;
        }
        onCheckedChange(!checked);
      }}
      className={twMerge(
        TRACK_BASE_CLASS,
        s.track,
        checked ? "bg-cyan-500/20" : "bg-zinc-900/85",
      )}
    >
      <span
        className={twMerge(
          THUMB_BASE_CLASS,
          s.thumb,
          checked ? s.onTranslateX : "translate-x-0",
        )}
        aria-hidden
      />
    </button>
  );
}
