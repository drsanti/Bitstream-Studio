import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ReadingLabelProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function ReadingLabel(props: ReadingLabelProps) {
  const { children, className, ...rest } = props;
  return (
    <span
      className={twMerge("shrink-0 text-[10px] font-medium text-zinc-500", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
