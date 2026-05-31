import { TRNToggleSwitch } from "../../../../../ui/TRN";

export type InspectorCompactToggleRowProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Slim toggle row for bordered inspector sections (not full TRNInlineToggleRow card). */
export function InspectorCompactToggleRow(props: InspectorCompactToggleRowProps) {
  const {
    label,
    hint,
    checked,
    onCheckedChange,
    disabled = false,
    ariaLabel,
  } = props;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-[11px] font-medium leading-snug text-zinc-200">
          {label}
        </span>
        <TRNToggleSwitch
          checked={checked}
          disabled={disabled}
          ariaLabel={ariaLabel ?? label}
          onCheckedChange={onCheckedChange}
        />
      </div>
      {hint != null && hint.length > 0 ? (
        <p className="text-[10px] leading-snug text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
