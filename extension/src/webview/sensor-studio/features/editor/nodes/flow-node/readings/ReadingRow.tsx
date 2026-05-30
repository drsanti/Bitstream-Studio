import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ReadingRowProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  values: ReactNode;
};

export function ReadingRow(props: ReadingRowProps) {
  const { label, values, className, ...rest } = props;
  return (
    <div
      className={twMerge(
        "flex min-h-[1.25rem] items-baseline justify-between gap-2 py-0.5",
        className,
      )}
      {...rest}
    >
      <ReadingRowLabelSlot>{label}</ReadingRowLabelSlot>
      <div className="flex min-w-0 shrink-0 justify-end">{values}</div>
    </div>
  );
}

function ReadingRowLabelSlot(props: { children: ReactNode }) {
  return <div className="min-w-0 max-w-[58%] shrink">{props.children}</div>;
}
