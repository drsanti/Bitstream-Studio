import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type TRNBadgedScrubNumberFieldGridProps = {
  columns?: 2 | 3;
  className?: string;
  children: ReactNode;
};

export function TRNBadgedScrubNumberFieldGrid(props: TRNBadgedScrubNumberFieldGridProps) {
  const { columns = 2, className, children } = props;
  const gridClass = columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return <div className={twMerge("grid gap-1.5", gridClass, className)}>{children}</div>;
}
