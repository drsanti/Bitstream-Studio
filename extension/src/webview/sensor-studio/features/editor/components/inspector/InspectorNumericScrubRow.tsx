import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNScrubNumberInput } from "../../../../../ui/TRN";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import {
  INSPECTOR_DENSE_FIELD_INNER_CLASS,
  INSPECTOR_DENSE_FIELD_SHELL,
} from "./inspector-numeric-field-shell";

export type InspectorTextFieldProps = {
  ariaLabel: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  className?: string;
  /** Optional icon inside the shell (e.g. Identity tag). */
  leadingIcon?: ReactNode;
};

/** Dense inspector text control — same shell as {@link InspectorNumericField}. */
export function InspectorTextField(props: InspectorTextFieldProps) {
  const { ariaLabel, value, placeholder, onChange, onBlur, className, leadingIcon } = props;

  return (
    <div className={"nodrag w-full " + INSPECTOR_DENSE_FIELD_SHELL}>
      {leadingIcon != null ? (
        <span className="flex shrink-0 items-center pl-0.5 text-zinc-500">{leadingIcon}</span>
      ) : null}
      <input
        type="text"
        aria-label={ariaLabel}
        className={twMerge(INSPECTOR_DENSE_FIELD_INNER_CLASS, className)}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
      />
    </div>
  );
}

export type InspectorTextRowProps = InspectorTextFieldProps & {
  label: string;
  description?: string;
};

/** Label + {@link InspectorTextField} row for typed inspector sections. */
export function InspectorTextRow(props: InspectorTextRowProps) {
  const { label, description, ...fieldProps } = props;

  return (
    <InspectorPropertyRow label={label} description={description}>
      <InspectorTextField {...fieldProps} />
    </InspectorPropertyRow>
  );
}

export type InspectorNumericFieldProps = {
  ariaLabel: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  fractionDigits?: number;
  /** Drag / wheel scrub on the value (TRN default). Set false for high-frequency store writes. */
  pointerScrubEnabled?: boolean;
  onCommit: (next: number) => void;
};

/** Dense inspector numeric control — {@link TRNScrubNumberInput} in shared shell chrome. */
export function InspectorNumericField(props: InspectorNumericFieldProps) {
  const {
    ariaLabel,
    value,
    min,
    max,
    step = 0.01,
    fractionDigits,
    pointerScrubEnabled = true,
    onCommit,
  } = props;

  return (
    <div className={"nodrag w-full " + INSPECTOR_DENSE_FIELD_SHELL}>
      <TRNScrubNumberInput
        aria-label={ariaLabel}
        className="w-full min-w-0"
        inputClassName="px-1 text-[11px] leading-none"
        value={value}
        min={min}
        max={max}
        step={step}
        fractionDigits={fractionDigits}
        pointerScrubEnabled={pointerScrubEnabled}
        onChange={onCommit}
      />
    </div>
  );
}

export type InspectorNumericScrubRowProps = InspectorNumericFieldProps & {
  label: string;
  description?: string;
};

/** Label + {@link InspectorNumericField} row for typed inspector sections. */
export function InspectorNumericScrubRow(props: InspectorNumericScrubRowProps) {
  const { label, description, ...fieldProps } = props;

  return (
    <InspectorPropertyRow label={label} description={description}>
      <InspectorNumericField {...fieldProps} />
    </InspectorPropertyRow>
  );
}
