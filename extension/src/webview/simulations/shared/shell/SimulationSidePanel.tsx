/*******************************************************************************
 * File Name : SimulationSidePanel.tsx
 *
 * Description : TRN-styled side panel slot for simulation controls.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type SimulationSidePanelProps = {
  title: string;
  side: "left" | "right";
  children: ReactNode;
  className?: string;
};

/**
 * Glass side panel overlay for simulation control UIs.
 */
export function SimulationSidePanel({
  title,
  side,
  children,
  className,
}: SimulationSidePanelProps)
{
  const sideClass =
    side === "left"
      ? "left-3 sm:left-4 max-w-[min(100%,22rem)]"
      : "right-3 sm:right-4 max-w-[min(100%,22rem)]";

  return (
    <aside
      className={twMerge(
        "pointer-events-auto absolute top-14 bottom-4 z-20 flex w-[min(100%,340px)] flex-col overflow-hidden rounded-xl border border-zinc-700/70 bg-zinc-950/88 shadow-xl backdrop-blur-md",
        sideClass,
        className,
      )}
    >
      <header className="shrink-0 border-b border-zinc-800 px-3 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {children}
      </div>
    </aside>
  );
}
