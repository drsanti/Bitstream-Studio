import { twMerge } from "tailwind-merge";
import { readingParamAxisValueClass } from "./param-axis-classes";
import type { ReadingAxis } from "./ReadingAxisNumber";

export type ReadingsGridAxisHeaderProps = {
  /** Grid template matching the data rows below. */
  gridTemplateColumns: string;
  /** Value column axis labels (one cell each — must match column count after the label column). */
  axes: readonly ReadingAxis[];
  className?: string;
};

/** Centered axis column labels aligned 1:1 with value columns below. */
export function ReadingsGridAxisHeader(props: ReadingsGridAxisHeaderProps) {
  const { gridTemplateColumns, axes, className } = props;

  return (
    <div
      className={twMerge(
        "grid w-full items-end gap-x-3 border-b border-zinc-800/60 pb-1.5 text-[9px] font-semibold uppercase tracking-wider",
        className,
      )}
      style={{ gridTemplateColumns }}
    >
      <span className="min-w-0" aria-hidden />
      {axes.map((axis) => (
        <span
          key={axis}
          className={twMerge(
            "text-center opacity-80",
            readingParamAxisValueClass(axis),
          )}
        >
          {axis}
        </span>
      ))}
    </div>
  );
}
