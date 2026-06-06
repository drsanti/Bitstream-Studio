import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type InspectorCanvasSubsectionProps = {
  title: string;
  children: ReactNode;
  /** When true, adds top divider spacing (not the first block in On flow canvas). */
  separated?: boolean;
  className?: string;
};

export function InspectorCanvasSubsection(props: InspectorCanvasSubsectionProps) {
  const { title, children, separated = false, className } = props;
  return (
    <div
      className={twMerge(
        "space-y-2",
        separated ? "border-t border-zinc-800/60 pt-2" : "",
        className,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      {children}
    </div>
  );
}
