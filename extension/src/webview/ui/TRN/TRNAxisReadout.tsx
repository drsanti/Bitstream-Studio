import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type TRNAxis = "x" | "y" | "z" | "w";

/** Matches {@link TRNVector3Field} axis badge rings. */
const READOUT_AXIS_META: Record<
  TRNAxis,
  { label: string; ring: string; valueClass: string }
> = {
  x: {
    label: "X",
    ring: "border-rose-500/70 text-rose-200",
    valueClass: "text-rose-200",
  },
  y: {
    label: "Y",
    ring: "border-emerald-500/70 text-emerald-200",
    valueClass: "text-emerald-200",
  },
  z: {
    label: "Z",
    ring: "border-sky-500/70 text-sky-200",
    valueClass: "text-sky-200",
  },
  w: {
    label: "W",
    ring: "border-pink-500/70 text-pink-200",
    valueClass: "text-pink-200",
  },
};

/** @deprecated Use {@link READOUT_AXIS_META} value classes — kept for exports. */
export const TRN_AXIS_VALUE_CLASS: Record<TRNAxis, string> = {
  x: "text-rose-300/95",
  y: "text-emerald-300/95",
  z: "text-sky-300/95",
  w: "text-pink-300/95",
};

export function formatTrnAxisNumber(value: number, decimals = 3): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

function gridColsClass(axisCount: number): string {
  if (axisCount === 4) {
    return "grid-cols-4";
  }
  if (axisCount === 2) {
    return "grid-cols-2";
  }
  return "grid-cols-3";
}

type TRNAxisVectorReadoutProps = {
  axes: readonly TRNAxis[];
  values: Partial<Record<TRNAxis, number>>;
  decimals?: number;
  className?: string;
};

/**
 * Read-only axis grid matching {@link TRNVector3Field} layout (`grid-cols-3 gap-1.5`).
 */
export function TRNAxisVectorReadout({
  axes,
  values,
  decimals = 3,
  className,
}: TRNAxisVectorReadoutProps) {
  return (
    <div
      className={twMerge(
        "grid gap-1.5",
        gridColsClass(axes.length),
        className,
      )}
    >
      {axes.map((axis) => {
        const meta = READOUT_AXIS_META[axis];
        const value = values[axis] ?? NaN;
        const formatted = formatTrnAxisNumber(value, decimals);

        return (
          <div
            key={axis}
            className="flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1"
          >
            <span
              className={
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-semibold " +
                meta.ring
              }
              aria-hidden
            >
              {meta.label}
            </span>
            <span
              className={
                "min-w-0 flex-1 truncate text-right font-mono text-[11px] tabular-nums leading-tight " +
                meta.valueClass
              }
              title={formatted}
            >
              {formatted}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type TRNPoseCompareRow = {
  label: string;
  target: Partial<Record<TRNAxis, number>>;
  current: Partial<Record<TRNAxis, number>>;
  axes: readonly TRNAxis[];
  decimals?: number;
};

type TRNPoseCompareBlockProps = TRNPoseCompareRow & {
  className?: string;
};

/** Target / Current stacked blocks — each side uses {@link TRNAxisVectorReadout}. */
export function TRNPoseCompareBlock({
  label,
  target,
  current,
  axes,
  decimals,
  className,
}: TRNPoseCompareBlockProps) {
  return (
    <div className={twMerge("space-y-1.5", className)}>
      <div className="text-[11px] font-medium text-zinc-300">{label}</div>
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Target
          </div>
          <TRNAxisVectorReadout axes={axes} values={target} decimals={decimals} />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Current
          </div>
          <TRNAxisVectorReadout axes={axes} values={current} decimals={decimals} />
        </div>
      </div>
    </div>
  );
}

type TRNPoseCompareStackProps = {
  rows: TRNPoseCompareRow[];
  className?: string;
};

export function TRNPoseCompareStack({
  rows,
  className,
}: TRNPoseCompareStackProps) {
  return (
    <div className={twMerge("space-y-3", className)}>
      {rows.map((row) => (
        <TRNPoseCompareBlock key={row.label} {...row} />
      ))}
    </div>
  );
}

type TRNKeyValueRowProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function TRNKeyValueRow({ label, value, className }: TRNKeyValueRowProps) {
  return (
    <div className={twMerge("space-y-1 text-[11px]", className)}>
      <div className="font-medium text-zinc-500">{label}</div>
      <div className="min-w-0">{value}</div>
    </div>
  );
}
