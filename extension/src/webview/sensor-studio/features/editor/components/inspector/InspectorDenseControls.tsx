import type { TRNSelectOption } from "../../../../../ui/TRN";
import { TRNColorRingPicker, TRNSelect } from "../../../../../ui/TRN";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  INSPECTOR_DENSE_FIELD_INNER_CLASS,
  INSPECTOR_DENSE_FIELD_SHELL,
} from "./inspector-numeric-field-shell";
import { INSPECTOR_DENSE_SELECT_BUTTON_CLASS } from "./inspector-dense-select-button";

function normalizeInspectorHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "#22d3ee";
}

export type InspectorSelectFieldProps = {
  ariaLabel: string;
  value: string;
  options: TRNSelectOption[];
  onChange: (next: string) => void;
  disabled?: boolean;
};

/** Dense inspector dropdown — {@link TRNSelect} glass menu (not native `<select>`). */
export function InspectorSelectField(props: InspectorSelectFieldProps) {
  const { ariaLabel, value, options, onChange, disabled = false } = props;

  return (
    <div className="nodrag w-full min-w-0">
      <TRNSelect
        size="sm"
        value={value}
        options={options}
        ariaLabel={ariaLabel}
        disabled={disabled}
        buttonClassName={INSPECTOR_DENSE_SELECT_BUTTON_CLASS}
        panelClassName="scrollbar-hide"
        onValueChange={onChange}
      />
    </div>
  );
}

export type InspectorSelectRowProps = InspectorSelectFieldProps & {
  label: string;
  description?: string;
};

export function InspectorSelectRow(props: InspectorSelectRowProps) {
  const { label, description, ...fieldProps } = props;
  return (
    <InspectorPropertyRow label={label} description={description}>
      <InspectorSelectField {...fieldProps} />
    </InspectorPropertyRow>
  );
}

export type InspectorColorFieldProps = {
  ariaLabel: string;
  value: string;
  onChange: (next: string) => void;
};

/** Dense inspector color swatch — square trigger opens {@link TRNColorRingPicker} hue ring. */
export function InspectorColorField(props: InspectorColorFieldProps) {
  const { ariaLabel, value, onChange } = props;
  const normalized = normalizeInspectorHexColor(value);

  return (
    <div className={"nodrag w-full min-w-0 " + INSPECTOR_DENSE_FIELD_SHELL}>
      <TRNColorRingPicker
        ariaLabel={ariaLabel}
        valueHex={normalized}
        triggerVariant="swatch"
        className="shrink-0"
        onValueHexChange={onChange}
      />
      <span className={`${INSPECTOR_DENSE_FIELD_INNER_CLASS} text-zinc-400`}>{normalized}</span>
    </div>
  );
}

export type InspectorColorRowProps = InspectorColorFieldProps & {
  label: string;
  description?: string;
};

export function InspectorColorRow(props: InspectorColorRowProps) {
  const { label, description, ...fieldProps } = props;
  return (
    <InspectorPropertyRow label={label} description={description}>
      <InspectorColorField {...fieldProps} />
    </InspectorPropertyRow>
  );
}
