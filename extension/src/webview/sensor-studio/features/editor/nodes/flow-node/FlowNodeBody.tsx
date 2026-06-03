import type { HTMLAttributes, ReactNode } from "react";
import { Children } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeBodyProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FlowNodeBody(props: FlowNodeBodyProps) {
  const { children, className, ...rest } = props;
  // JSX indentation/newlines can become whitespace text nodes, so we treat "only whitespace"
  // as empty content.
  const childArray = Children.toArray(children);
  const hasContent = childArray.some((c) => {
    if (typeof c === "string") {
      return c.trim().length > 0;
    }
    return true;
  });
  return (
    <div
      className={twMerge(
        "nodrag min-w-0 w-full max-w-full overflow-hidden",
        hasContent ? "px-2 pb-2 pt-1" : "px-0 pb-0 pt-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
