import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import {
  TRNScrubNumberInput,
  type TRNScrubInteractionConfig,
} from "./TRNScrubNumberInput";

export type TRNVector3 = { x: number; y: number; z: number };

export type TRNVector3AxisLocks = {
  x: boolean;
  y: boolean;
  z: boolean;
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
  /** Per-axis lock toggles inside each row (number · unit · lock). Default true. */
  showAxisLocks?: boolean;
  /** Controlled per-axis locks. */
  lockedAxes?: TRNVector3AxisLocks;
  /** Defaults when using internal lock state. */
  defaultLockedAxes?: Partial<TRNVector3AxisLocks>;
  onLockedAxesChange?: (locks: TRNVector3AxisLocks) => void;
};

const AXIS_META = [
  { k: "x" as const, label: "X", ring: "border-rose-500/70 text-rose-200" },
  { k: "y" as const, label: "Y", ring: "border-emerald-500/70 text-emerald-200" },
  { k: "z" as const, label: "Z", ring: "border-sky-500/70 text-sky-200" },
] as const;

/** All axes editable — useful for controlled `lockedAxes` reset. */
export const TRN_VECTOR3_AXIS_UNLOCKED: TRNVector3AxisLocks = {
  x: false,
  y: false,
  z: false,
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

      <div className="grid grid-cols-3 gap-1.5">
        {AXIS_META.map((axis) => {
          const v = value[axis.k];
          const axisLocked = locks[axis.k];
          return (
            <label
              key={axis.k}
              className={
                "flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1 " +
                (disabled ? "opacity-60 " : "") +
                (axisLocked && !disabled ? "opacity-80 " : "")
              }
            >
              <span
                className={
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-semibold " +
                  axis.ring
                }
                aria-hidden
              >
                {axis.label}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-0.5">
                <TRNScrubNumberInput
                  aria-label={
                    typeof label === "string"
                      ? `${label} ${axis.label}`
                      : `${axis.label} axis`
                  }
                  value={Number.isFinite(v) ? v : 0}
                  step={step}
                  min={min}
                  max={max}
                  disabled={disabled}
                  locked={axisLocked}
                  horizontalPxPerTenthPercent={horizontalPxPerTenthPercent}
                  verticalPxPerPercent={verticalPxPerPercent}
                  wheelPixelAccumThreshold={wheelPixelAccumThreshold}
                  pointerScrubEnabled={pointerScrubEnabled}
                  fractionDigits={fractionDigits}
                  onChange={(next) => {
                    if (axisLocked) {
                      return;
                    }
                    onChange({ ...value, [axis.k]: next });
                  }}
                />
                {unit != null && unit.length > 0 ? (
                  <span className="shrink-0 pl-0.5 text-[10px] tracking-tight text-zinc-500">
                    {unit}
                  </span>
                ) : null}
                {showAxisLocks ? (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={
                      axisLocked
                        ? `Unlock ${axis.label} axis`
                        : `Lock ${axis.label} axis`
                    }
                    aria-pressed={axisLocked}
                    title={
                      axisLocked
                        ? `${axis.label}: unlock to edit`
                        : `${axis.label}: lock from edits`
                    }
                    className={
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 outline-none transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-400/45 disabled:pointer-events-none disabled:opacity-40 " +
                      (axisLocked
                        ? "text-amber-300/95"
                        : "text-zinc-500 hover:text-zinc-300")
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setAxisLock(axis.k, !axisLocked);
                    }}
                  >
                    {axisLocked ? (
                      <Lock
                        className="h-3 w-3"
                        aria-hidden
                        strokeWidth={2.25}
                      />
                    ) : (
                      <Unlock
                        className="h-3 w-3"
                        aria-hidden
                        strokeWidth={2.25}
                      />
                    )}
                  </button>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
