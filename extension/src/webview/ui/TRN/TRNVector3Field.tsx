import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { TRNBadgedScrubNumberField } from "./TRNBadgedScrubNumberField.js";
import { TRNBadgedScrubNumberFieldGrid } from "./TRNBadgedScrubNumberFieldGrid.js";
import type { TRNScrubInteractionConfig } from "./TRNScrubNumberInput.js";

export type TRNVector3 = { x: number; y: number; z: number };

export type TRNVector3AxisLocks = {
  x: boolean;
  y: boolean;
  z: boolean;
};

const AXIS_META = [
  { k: "x" as const, label: "X", tone: "rose" as const },
  { k: "y" as const, label: "Y", tone: "emerald" as const },
  { k: "z" as const, label: "Z", tone: "sky" as const },
] as const;

/** All axes editable — useful for controlled `lockedAxes` reset. */
export const TRN_VECTOR3_AXIS_UNLOCKED: TRNVector3AxisLocks = {
  x: false,
  y: false,
  z: false,
};

export type TRNVector3FieldProps = TRNScrubInteractionConfig & {
  label?: ReactNode;
  value: TRNVector3;
  onChange: (next: TRNVector3) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Overrides heuristic display decimals for all axes (see `TRNScrubNumberInput`). */
  fractionDigits?: number;
  disabled?: boolean;
  /** Optional unit suffix shown in the field (e.g. "deg"). */
  unit?: string;
  className?: string;
  /** When true, drag/wheel scrub adjusts values (see `TRNScrubNumberInput`). Default false. */
  pointerScrubEnabled?: boolean;
  /** Per-axis lock toggles inside each row. Default true. */
  showAxisLocks?: boolean;
  /** Controlled per-axis locks. */
  lockedAxes?: TRNVector3AxisLocks;
  /** Defaults when using internal lock state. */
  defaultLockedAxes?: Partial<TRNVector3AxisLocks>;
  onLockedAxesChange?: (locks: TRNVector3AxisLocks) => void;
};

export function TRNVector3Field(props: TRNVector3FieldProps) {
  const {
    label,
    value,
    onChange,
    step = 0.01,
    min,
    max,
    fractionDigits,
    disabled = false,
    unit,
    className = "",
    showAxisLocks = true,
    lockedAxes: lockedAxesControlled,
    defaultLockedAxes,
    onLockedAxesChange,
    horizontalPxPerTenthPercent,
    verticalPxPerPercent,
    wheelPixelAccumThreshold,
    pointerScrubEnabled,
  } = props;

  const [internalLocks, setInternalLocks] = useState<TRNVector3AxisLocks>(() => ({
    x: defaultLockedAxes?.x ?? false,
    y: defaultLockedAxes?.y ?? false,
    z: defaultLockedAxes?.z ?? false,
  }));

  const locks =
    lockedAxesControlled !== undefined ? lockedAxesControlled : internalLocks;

  const setAxisLock = useCallback(
    (axis: keyof TRNVector3AxisLocks, locked: boolean) => {
      const next = { ...locks, [axis]: locked };
      if (lockedAxesControlled === undefined) {
        setInternalLocks(next);
      }
      onLockedAxesChange?.(next);
    },
    [lockedAxesControlled, locks, onLockedAxesChange],
  );

  return (
    <div className={"space-y-1 " + className}>
      {label != null ? (
        <div className="text-[11px] font-medium text-zinc-200">{label}</div>
      ) : null}

      <TRNBadgedScrubNumberFieldGrid columns={3}>
        {AXIS_META.map((axis) => {
          const v = value[axis.k];
          const axisLocked = locks[axis.k];
          const ariaLabel =
            typeof label === "string" ? `${label} ${axis.label}` : `${axis.label} axis`;

          return (
            <TRNBadgedScrubNumberField
              key={axis.k}
              badge={{ kind: "text", text: axis.label, tone: axis.tone }}
              ariaLabel={ariaLabel}
              value={Number.isFinite(v) ? v : 0}
              step={step}
              min={min}
              max={max}
              fractionDigits={fractionDigits}
              disabled={disabled}
              locked={showAxisLocks ? axisLocked : false}
              onLockedChange={
                showAxisLocks
                  ? (next) => {
                      setAxisLock(axis.k, next);
                    }
                  : undefined
              }
              suffix={unit != null && unit.length > 0 ? unit : undefined}
              density="compact"
              interaction={{
                pointerScrubEnabled: pointerScrubEnabled ?? false,
                horizontalPxPerTenthPercent,
                verticalPxPerPercent,
                wheelPixelAccumThreshold,
              }}
              appearance={
                showAxisLocks
                  ? undefined
                  : {
                      variant: "full",
                      stepButtonsVisibility: "hover",
                      lockIconVisibility: "hidden",
                      resetIconVisibility: "hidden",
                      clearIconVisibility: "hidden",
                    }
              }
              onChange={(next) => {
                onChange({ ...value, [axis.k]: next });
              }}
            />
          );
        })}
      </TRNBadgedScrubNumberFieldGrid>
    </div>
  );
}
