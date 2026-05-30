import { twMerge } from "tailwind-merge";
import { ReadingNumber, type ReadingNumberProps } from "./ReadingNumber";
import { readingParamAxisValueClass } from "./param-axis-classes";

export type ReadingAxis = "x" | "y" | "z" | "w";

export type ReadingAxisNumberProps = ReadingNumberProps & {
  axis: ReadingAxis;
  /** Muted letter shown before the value (e.g. "x"). */
  showAxisPrefix?: boolean;
};

const AXIS_TEXT: Record<ReadingAxis, string> = {
  x: "x",
  y: "y",
  z: "z",
  w: "w",
};

export function ReadingAxisNumber(props: ReadingAxisNumberProps) {
  const { axis, showAxisPrefix = false, className, ...numberProps } = props;
  return (
    <span
      className="inline-flex min-w-14 items-baseline justify-end gap-0.5"
      data-axis={axis}
    >
      {showAxisPrefix ? (
        <span className="w-2 text-[9px] font-medium uppercase text-zinc-500">{AXIS_TEXT[axis]}</span>
      ) : null}
      <ReadingNumber
        className={twMerge(
          "text-right text-[10px]",
          readingParamAxisValueClass(axis),
          className,
        )}
        {...numberProps}
      />
    </span>
  );
}
