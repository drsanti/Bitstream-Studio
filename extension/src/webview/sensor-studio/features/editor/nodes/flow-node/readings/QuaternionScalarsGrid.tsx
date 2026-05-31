import { ReadingAxisNumber } from "./ReadingAxisNumber";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./socket-live-value-cell";
import { twMerge } from "tailwind-merge";

export type QuaternionScalarsGridProps = {
  w: number | null | undefined;
  x: number | null | undefined;
  y: number | null | undefined;
  z: number | null | undefined;
  fractionDigits?: number;
  /** Merged per component; axis default tints apply when omitted. */
  valueClassName?: string;
  /** Tighter gaps for socket-row live previews. */
  compact?: boolean;
};

/** Four quaternion components in one row (aligns with BMI270 quaternion column order: w, x, y, z). */
export function QuaternionScalarsGrid(props: QuaternionScalarsGridProps) {
  const { w, x, y, z, fractionDigits = 3, valueClassName, compact = false } = props;

  return (
    <div
      className={
        compact
          ? twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "flex max-w-full items-baseline justify-end gap-x-1")
          : "grid w-max max-w-full grid-cols-4 items-baseline justify-items-end gap-x-2 text-[10px]"
      }
    >
      <ReadingAxisNumber
        axis="w"
        compact={compact}
        socketFixedCell={compact}
        value={w}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="x"
        compact={compact}
        socketFixedCell={compact}
        value={x}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="y"
        compact={compact}
        socketFixedCell={compact}
        value={y}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="z"
        compact={compact}
        socketFixedCell={compact}
        value={z}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
    </div>
  );
}
