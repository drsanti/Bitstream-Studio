import { twMerge } from "tailwind-merge";
import { ReadingNumber, type ReadingNumberProps } from "./ReadingNumber";
import { readingParamAxisValueClass } from "./param-axis-classes";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY, socketLiveValueCellClass } from "./socket-live-value-cell";

export type ReadingAxis = "x" | "y" | "z" | "w";

export type ReadingAxisNumberProps = ReadingNumberProps & {
  axis: ReadingAxis;
  /** Muted letter shown before the value (e.g. "x"). */
  showAxisPrefix?: boolean;
  /** Tighter layout for socket-row live previews (no min column width). */
  compact?: boolean;
  /** Fixed cell width on socket rows — values do not shift when digits change. */
  socketFixedCell?: boolean;
};

const AXIS_TEXT: Record<ReadingAxis, string> = {
  x: "x",
  y: "y",
  z: "z",
  w: "w",
};

export function ReadingAxisNumber(props: ReadingAxisNumberProps) {
  const {
    axis,
    showAxisPrefix = false,
    compact = false,
    socketFixedCell = false,
    className,
    fractionDigits = 2,
    ...numberProps
  } = props;
  return (
    <span
      className={
        compact
          ? "inline-flex items-baseline justify-end gap-0.5"
          : "inline-flex min-w-14 items-baseline justify-end gap-0.5"
      }
      data-axis={axis}
    >
      {showAxisPrefix ? (
        <span className="w-2 text-[9px] font-medium uppercase text-zinc-500">{AXIS_TEXT[axis]}</span>
      ) : null}
      <ReadingNumber
        className={twMerge(
          "text-right",
          compact && socketFixedCell
            ? twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, socketLiveValueCellClass(fractionDigits))
            : "text-[10px]",
          readingParamAxisValueClass(axis),
          className,
        )}
        fractionDigits={fractionDigits}
        {...numberProps}
      />
    </span>
  );
}
