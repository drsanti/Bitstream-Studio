import { twMerge } from "tailwind-merge";
import { TRNBadgedScrubNumberField } from "./TRNBadgedScrubNumberField.js";
import { TRNBadgedScrubNumberFieldGrid } from "./TRNBadgedScrubNumberFieldGrid.js";
import type { TRNScrubFieldBadgeSpec } from "./TRNScrubFieldBadge.js";
import type { TRNScrubNumberFieldAppearance } from "./TRNScrubNumberField.js";

export type TRNGridPlacementValue = {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
};

export type TRNGridPlacementFieldKey = keyof TRNGridPlacementValue;

export type TRNGridPlacementBadgedFieldsLayout = "stack" | "grid" | "strip";

export type TRNGridPlacementBadgedFieldsLimits = {
  columnMin?: number;
  columnMax?: number;
  rowMin?: number;
  rowMax?: number;
  columnSpanMin?: number;
  columnSpanMax?: number;
  rowSpanMin?: number;
  rowSpanMax?: number;
};

export type TRNGridPlacementBadgedFieldsProps = {
  placement: TRNGridPlacementValue;
  onPatch: (patch: Partial<TRNGridPlacementValue>) => void;
  layout?: TRNGridPlacementBadgedFieldsLayout;
  disabled?: boolean;
  limits?: TRNGridPlacementBadgedFieldsLimits;
  className?: string;
};

const PLACEMENT_BADGED_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "always",
  lockIconVisibility: "hidden",
  resetIconVisibility: "hidden",
  clearIconVisibility: "hidden",
};

const PLACEMENT_AXIS_META: readonly {
  key: TRNGridPlacementFieldKey;
  badge: TRNScrubFieldBadgeSpec;
  ariaLabel: string;
  limitKeys: {
    min: keyof TRNGridPlacementBadgedFieldsLimits;
    max: keyof TRNGridPlacementBadgedFieldsLimits;
  };
  defaultMin: number;
  defaultMax: number;
}[] = [
  {
    key: "row",
    badge: { kind: "text", text: "R", tone: "emerald" },
    ariaLabel: "Row",
    limitKeys: { min: "rowMin", max: "rowMax" },
    defaultMin: 1,
    defaultMax: 200,
  },
  {
    key: "column",
    badge: { kind: "text", text: "C", tone: "sky" },
    ariaLabel: "Column",
    limitKeys: { min: "columnMin", max: "columnMax" },
    defaultMin: 1,
    defaultMax: 48,
  },
  {
    key: "columnSpan",
    badge: { kind: "text", text: "W", tone: "violet" },
    ariaLabel: "Width in columns",
    limitKeys: { min: "columnSpanMin", max: "columnSpanMax" },
    defaultMin: 1,
    defaultMax: 48,
  },
  {
    key: "rowSpan",
    badge: { kind: "text", text: "H", tone: "amber" },
    ariaLabel: "Height in rows",
    limitKeys: { min: "rowSpanMin", max: "rowSpanMax" },
    defaultMin: 1,
    defaultMax: 200,
  },
] as const;

function resolveLimit(
  limits: TRNGridPlacementBadgedFieldsLimits | undefined,
  key: keyof TRNGridPlacementBadgedFieldsLimits,
  fallback: number,
): number {
  return limits?.[key] ?? fallback;
}

function PlacementBadgedField(props: {
  axis: (typeof PLACEMENT_AXIS_META)[number];
  value: number;
  limits?: TRNGridPlacementBadgedFieldsLimits;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  const { axis, value, limits, disabled = false, onChange } = props;
  const min = resolveLimit(limits, axis.limitKeys.min, axis.defaultMin);
  const max = resolveLimit(limits, axis.limitKeys.max, axis.defaultMax);

  return (
    <TRNBadgedScrubNumberField
      badge={axis.badge}
      ariaLabel={axis.ariaLabel}
      value={value}
      min={min}
      max={max}
      step={1}
      fractionDigits={0}
      disabled={disabled}
      density="compact"
      size="sm"
      appearance={PLACEMENT_BADGED_APPEARANCE}
      interaction={{ pointerScrubEnabled: false }}
      onChange={onChange}
    />
  );
}

/**
 * R / C / W / H badged scrub rows for 1-based grid placement (Course Content grid, Dashboard widgets).
 */
export function TRNGridPlacementBadgedFields(props: TRNGridPlacementBadgedFieldsProps) {
  const {
    placement,
    onPatch,
    layout = "stack",
    disabled = false,
    limits,
    className,
  } = props;

  const fields = PLACEMENT_AXIS_META.map((axis) => (
    <PlacementBadgedField
      key={axis.key}
      axis={axis}
      value={placement[axis.key]}
      limits={limits}
      disabled={disabled}
      onChange={(next) => {
        onPatch({ [axis.key]: next });
      }}
    />
  ));

  if (layout === "strip") {
    return (
      <div className={twMerge("grid grid-cols-4 gap-1.5", className)}>{fields}</div>
    );
  }

  if (layout === "grid") {
    return (
      <TRNBadgedScrubNumberFieldGrid className={className} columns={2}>
        {fields}
      </TRNBadgedScrubNumberFieldGrid>
    );
  }

  return <div className={twMerge("flex flex-col gap-1.5", className)}>{fields}</div>;
}
