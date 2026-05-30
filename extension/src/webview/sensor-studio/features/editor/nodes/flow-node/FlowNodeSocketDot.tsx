import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketDotProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
};

/** Visual wrapper for a handle; keeps hit area stable. Does not render `Handle` itself. */
export function FlowNodeSocketDot(props: FlowNodeSocketDotProps) {
  const { children, className, ...rest } = props;
  return (
    <span
      className={twMerge("relative inline-flex items-center justify-center", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
