import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketRegionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FlowNodeSocketRegion(props: FlowNodeSocketRegionProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      className={twMerge(
        "nodrag flex min-w-0 w-full max-w-full flex-col gap-0.5 border-b border-zinc-700/60 px-2 py-1.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
