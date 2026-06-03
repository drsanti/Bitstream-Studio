import { TRNHintTooltip, TRNToggleSwitch } from "../../../../../ui/TRN";

export type InspectorCompactToggleRowProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Matches {@link TRNToggleSwitch} `md` track height for vertical alignment with the switch. */
const TOGGLE_ROW_MIN_H_PX = "min-h-[18px]";

const LABEL_CLASS =
  `inline-flex ${TOGGLE_ROW_MIN_H_PX} items-center text-[11px] font-medium leading-normal text-zinc-200`;

function InspectorCompactToggleLabel(props: { label: string; hint?: string }) {
  const { label, hint } = props;

  if (hint != null && hint.length > 0) {
    return (
      <TRNHintTooltip
        className="inline-flex items-center"
        trigger={
          <span className={`${LABEL_CLASS} cursor-help`}>
            {label}
          </span>
        }
        content={hint}
        triggerAriaLabel={`About ${label}`}
        placement="top-start"
        triggerWrapper="span"
        triggerClassName="!inline-flex !h-auto !min-h-0 !items-center !p-0"
        wide={hint.length > 120}
      />
    );
  }

  return <span className={LABEL_CLASS}>{label}</span>;
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
    <div
      className={`flex ${TOGGLE_ROW_MIN_H_PX} items-center justify-between gap-3 rounded border border-zinc-700/80 bg-transparent px-2 py-1`}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <InspectorCompactToggleLabel label={label} hint={hint} />
      </div>
      <div className="flex shrink-0 items-center">
        <TRNToggleSwitch
          checked={checked}
          disabled={disabled}
          ariaLabel={ariaLabel ?? label}
          onCheckedChange={onCheckedChange}
        />
      </div>
    </div>
  );
}
