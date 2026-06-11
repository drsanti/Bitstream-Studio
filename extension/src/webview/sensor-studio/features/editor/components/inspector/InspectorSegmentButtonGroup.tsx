import { TRNButton } from "../../../../../ui/TRN";
import type { CSSProperties, ReactNode } from "react";

export type InspectorSegmentOption<T extends string | number> = {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
};

export type InspectorSegmentLayout =
  | "row"
  | "stack"
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "grid-5"
  | "grid-6";

export type InspectorSegmentButtonGroupProps<T extends string | number> = {
  ariaLabel: string;
  value: T;
  options: InspectorSegmentOption<T>[];
  onChange: (value: T) => void;
  /**
   * `row` = flex row (equal flex-1 segments; may wrap labels in narrow panels).
   * `stack` = full-width buttons, single-line labels (inspector sidebars).
   * `grid-N` = N equal columns, full parent width, `gap-1.5` between chips.
   */
  layout?: InspectorSegmentLayout;
};

const FLEX_LAYOUT_CLASS: Record<"row" | "stack", string> = {
  row: "flex w-full min-w-0 flex-wrap gap-1.5",
  stack: "flex w-full min-w-0 flex-col gap-1.5",
};

const FLEX_BUTTON_CLASS: Record<"row" | "stack", string> = {
  row: "min-w-0 flex-1 font-sans",
  stack: "w-full shrink-0 whitespace-nowrap font-sans",
};

const GRID_BUTTON_CLASS = "min-w-0 w-full font-sans whitespace-nowrap";

function parseGridColumnCount(layout: InspectorSegmentLayout): number | null {
  const match = /^grid-(\d+)$/.exec(layout);
  if (match == null) {
    return null;
  }
  const cols = Number(match[1]);
  return Number.isFinite(cols) && cols > 0 ? cols : null;
}

function gridContainerStyle(columnCount: number): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
}

export function InspectorSegmentButtonGroup<T extends string | number>(
  props: InspectorSegmentButtonGroupProps<T>,
) {
  const { ariaLabel, value, options, onChange, layout = "row" } = props;

  const gridColumns = parseGridColumnCount(layout);
  const isGrid = gridColumns != null;

  const containerClass = isGrid
    ? "grid w-full min-w-0 gap-1.5"
    : FLEX_LAYOUT_CLASS[layout as "row" | "stack"];

  const buttonClass = isGrid
    ? GRID_BUTTON_CLASS
    : FLEX_BUTTON_CLASS[layout as "row" | "stack"];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={containerClass}
      style={isGrid ? gridContainerStyle(gridColumns) : undefined}
    >
      {options.map((option) => (
        <TRNButton
          key={String(option.value)}
          size="compact"
          className={buttonClass}
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
