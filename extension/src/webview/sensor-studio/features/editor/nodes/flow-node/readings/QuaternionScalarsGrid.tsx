import type { HTMLAttributes } from "react";
import { ReadingAxisNumber } from "./ReadingAxisNumber";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./socket-live-value-cell";
import { twMerge } from "tailwind-merge";

export type QuaternionScalarsGridProps = HTMLAttributes<HTMLDivElement> & {
  w: number | null | undefined;
  x: number | null | undefined;
  y: number | null | undefined;
  z: number | null | undefined;
  fractionDigits?: number;
  /** Merged per component; axis default tints apply when omitted. */
  valueClassName?: string;
  /** Tighter gaps for socket-row live previews. */
  compact?: boolean;
  /** Row alignment for compact layout (socket rows default end). */
  align?: "start" | "end";
  /** Digit alignment inside fixed cells (library palette uses start). */
  textAlign?: "left" | "right";
};

/** Four quaternion components in one row (aligns with BMI270 quaternion column order: w, x, y, z). */
export function QuaternionScalarsGrid(props: QuaternionScalarsGridProps) {
  const {
    w,
    x,
    y,
    z,
    fractionDigits = 3,
    valueClassName,
    compact = false,
    align = "end",
    textAlign = "right",
    className,
    ...rest
  } = props;
  const compactJustify = align === "start" ? "justify-start" : "justify-end";
  const gridJustify = align === "start" ? "justify-items-start" : "justify-items-end";

  return (
    <div
      className={
        compact
          ? twMerge(
              SOCKET_LIVE_VALUE_TYPOGRAPHY,
              "flex max-w-full items-baseline gap-x-1",
              compactJustify,
              className,
            )
          : twMerge(
              "grid w-max max-w-full grid-cols-4 items-baseline gap-x-2 text-[10px]",
              gridJustify,
              className,
            )
      }
      {...rest}
    >
      <ReadingAxisNumber
        axis="w"
        compact={compact}
        socketFixedCell={compact}
        textAlign={textAlign}
        value={w}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="x"
        compact={compact}
        socketFixedCell={compact}
        textAlign={textAlign}
        value={x}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="y"
        compact={compact}
        socketFixedCell={compact}
        textAlign={textAlign}
        value={y}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="z"
        compact={compact}
        socketFixedCell={compact}
        textAlign={textAlign}
        value={z}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
    </div>
  );
}
