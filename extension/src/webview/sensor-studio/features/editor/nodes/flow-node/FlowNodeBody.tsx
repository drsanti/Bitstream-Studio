import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeBodyProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FlowNodeBody(props: FlowNodeBodyProps) {
  const { children, className, ...rest } = props;
  return (
    <div className={twMerge("nodrag min-w-0 w-full max-w-full px-2 pb-2 pt-1", className)} {...rest}>
      {children}
    </div>
  );
}
