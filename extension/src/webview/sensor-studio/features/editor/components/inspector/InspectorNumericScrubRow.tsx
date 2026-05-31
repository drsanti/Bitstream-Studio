import { TRNScrubNumberInput } from "../../../../../ui/TRN";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { INSPECTOR_DENSE_NUMERIC_FIELD_SHELL } from "./inspector-numeric-field-shell";

export type InspectorNumericScrubRowProps = {
  label: string;
  description?: string;
  ariaLabel: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (next: number) => void;
};

/** Label + {@link TRNScrubNumberInput} row with shared inspector numeric shell. */
export function InspectorNumericScrubRow(props: InspectorNumericScrubRowProps) {
  const {
    label,
    description,
    ariaLabel,
    value,
    min,
    max,
    step = 0.01,
    onCommit,
  } = props;

  return (
    <InspectorPropertyRow label={label} description={description}>
      <div className={"nodrag w-full " + INSPECTOR_DENSE_NUMERIC_FIELD_SHELL}>
        <TRNScrubNumberInput
          aria-label={ariaLabel}
          className="w-full min-w-0"
          inputClassName="text-xs"
          value={value}
          min={min}
          max={max}
          step={step}
          pointerScrubEnabled={false}
          onChange={onCommit}
        />
      </div>
    </InspectorPropertyRow>
  );
}
