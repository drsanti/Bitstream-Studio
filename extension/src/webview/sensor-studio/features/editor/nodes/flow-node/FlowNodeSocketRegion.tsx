import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketRegionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /**
   * When true, children output rows use subgrid so port labels share one column
   * sized to the widest label (live sensor source nodes).
   */
  alignedOutputColumns?: boolean;
};

export function FlowNodeSocketRegion(props: FlowNodeSocketRegionProps) {
  const { children, className, alignedOutputColumns = false, ...rest } = props;
  return (
    <div
      className={twMerge(
        "nodrag min-w-0 w-full max-w-full overflow-visible border-b border-zinc-700/60 py-1.5 pl-0 pr-0",
        alignedOutputColumns
          ? "grid grid-cols-[minmax(0,1fr)_max-content_0] gap-x-0 gap-y-0.5"
          : "flex flex-col gap-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
