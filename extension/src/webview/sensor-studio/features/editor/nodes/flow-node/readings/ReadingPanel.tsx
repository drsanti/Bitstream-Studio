import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ReadingPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ReadingPanel(props: ReadingPanelProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      className={twMerge(
        "mt-2 min-w-0 w-full max-w-full overflow-hidden rounded border border-zinc-700/80 bg-black/40 px-2 py-1.5 text-[10px] leading-snug text-zinc-300",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
