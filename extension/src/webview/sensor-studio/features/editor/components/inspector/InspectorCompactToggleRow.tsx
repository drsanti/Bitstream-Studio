import { TRNHintTooltip, TRNToggleSwitch } from "../../../../../ui/TRN";

export type InspectorCompactToggleRowProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

function InspectorCompactToggleLabel(props: { label: string; hint?: string }) {
  const { label, hint } = props;
  const labelClass =
    "min-w-0 text-[11px] font-medium leading-snug text-zinc-200";

  if (hint != null && hint.length > 0) {
    return (
      <TRNHintTooltip
        trigger={
          <span className={labelClass + " cursor-help"}>
            {label}
          </span>
        }
        content={hint}
        triggerAriaLabel={`About ${label}`}
        placement="top-start"
        triggerWrapper="span"
        triggerClassName="min-w-0"
        wide={hint.length > 120}
      />
    );
  }

  return <span className={labelClass}>{label}</span>;
}

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
    <div className="flex items-center justify-between gap-3">
      <InspectorCompactToggleLabel label={label} hint={hint} />
      <TRNToggleSwitch
        checked={checked}
        disabled={disabled}
        ariaLabel={ariaLabel ?? label}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
