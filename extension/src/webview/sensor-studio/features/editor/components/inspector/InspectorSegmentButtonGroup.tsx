import { TRNButton } from "../../../../../ui/TRN";
import type { ReactNode } from "react";

export type InspectorSegmentOption<T extends string | number> = {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
};

export type InspectorSegmentButtonGroupProps<T extends string | number> = {
  ariaLabel: string;
  value: T;
  options: InspectorSegmentOption<T>[];
  onChange: (value: T) => void;
  /**
   * `row` = flex row (equal flex-1 segments; may wrap labels in narrow panels).
   * `stack` = full-width buttons, single-line labels (inspector sidebars).
   */
  layout?: "row" | "stack" | "grid-2" | "grid-5";
};

const LAYOUT_CLASS: Record<NonNullable<InspectorSegmentButtonGroupProps<string>["layout"]>, string> =
  {
    row: "flex flex-wrap gap-1.5",
    stack: "flex flex-col gap-1.5",
    "grid-2": "grid grid-cols-2 gap-1.5",
    "grid-5": "grid grid-cols-5 gap-1.5",
  };

const BUTTON_CLASS: Record<NonNullable<InspectorSegmentButtonGroupProps<string>["layout"]>, string> =
  {
    row: "min-w-0 flex-1 font-sans",
    stack: "w-full shrink-0 whitespace-nowrap font-sans",
    "grid-2": "min-w-0 font-sans whitespace-nowrap",
    "grid-5": "min-w-0 font-sans whitespace-nowrap",
  };

export function InspectorSegmentButtonGroup<T extends string | number>(
  props: InspectorSegmentButtonGroupProps<T>,
) {
  const { ariaLabel, value, options, onChange, layout = "row" } = props;

  return (
    <div role="group" aria-label={ariaLabel} className={LAYOUT_CLASS[layout]}>
      {options.map((option) => (
        <TRNButton
          key={String(option.value)}
          size="compact"
          className={BUTTON_CLASS[layout]}
          selected={value === option.value}
          prefixIcon={option.icon}
          hint={option.hint}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </TRNButton>
      ))}
    </div>
  );
}
