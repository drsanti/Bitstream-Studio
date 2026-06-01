import type { TRNSelectOption } from "../../../../../ui/TRN";
import { TRNSelect } from "../../../../../ui/TRN";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  INSPECTOR_DENSE_COLOR_INNER_CLASS,
  INSPECTOR_DENSE_FIELD_SHELL,
} from "./inspector-numeric-field-shell";
import { INSPECTOR_DENSE_SELECT_BUTTON_CLASS } from "./inspector-dense-select-button";

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

/** Dense inspector color swatch — same outer shell height as numeric/text fields. */
export function InspectorColorField(props: InspectorColorFieldProps) {
  const { ariaLabel, value, onChange } = props;

  return (
    <div
      className={
        "nodrag w-full overflow-hidden p-0 " + INSPECTOR_DENSE_FIELD_SHELL
      }
    >
      <input
        type="color"
        aria-label={ariaLabel}
        className={INSPECTOR_DENSE_COLOR_INNER_CLASS}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
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
