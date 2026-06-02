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
  /** `row` = single flex row; `grid-2` = 2 columns; `grid-5` = 5 columns (grid size). */
  layout?: "row" | "grid-2" | "grid-5";
};

const LAYOUT_CLASS: Record<NonNullable<InspectorSegmentButtonGroupProps<string>["layout"]>, string> =
  {
    row: "flex flex-wrap gap-1.5",
    "grid-2": "grid grid-cols-2 gap-1.5",
    "grid-5": "grid grid-cols-5 gap-1.5",
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
          className="min-w-0 flex-1 font-sans"
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
