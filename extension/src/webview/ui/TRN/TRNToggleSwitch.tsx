export type TRNToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function TRNToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
}: TRNToggleSwitchProps)
{
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
      className={
        "relative inline-flex h-5 w-10 items-center rounded-full border border-zinc-700/80 transition-colors disabled:opacity-50 " +
        (checked
          ? "bg-cyan-500/20"
          : "bg-zinc-900/85")
      }
    >
      <span
        className={
          "inline-block h-3.5 w-3.5 transform rounded-full border border-emerald-300/50 bg-[rgba(16,185,129,0.72)] shadow-[0_0_0_2px_rgba(8,12,20,0.95)] transition-transform " +
          (checked ? "translate-x-[1.25rem]" : "translate-x-1")
        }
      />
    </button>
  );
}
