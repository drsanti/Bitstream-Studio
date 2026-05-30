import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ReadingValueGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ReadingValueGroup(props: ReadingValueGroupProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      className={twMerge("flex shrink-0 flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
