/*******************************************************************************
 * File Name : SimulationAppShell.tsx
 *
 * Description : Full-viewport layout: toolbar + canvas + optional side panels.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { ReactNode } from "react";
import { SimulationToolbar } from "./SimulationToolbar.js";

export type SimulationAppShellProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  canvas: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
};

/**
 * Composes toolbar, WebGL viewport, and optional left/right control panels.
 */
export function SimulationAppShell({
  title,
  subtitle,
  onBack,
  canvas,
  leftPanel,
  rightPanel,
}: SimulationAppShellProps)
{
  return (
    <div className="fixed inset-0 z-400 flex min-h-0 flex-col bg-zinc-950">
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{canvas}</div>
        <SimulationToolbar title={title} subtitle={subtitle} onBack={onBack} />
        {leftPanel}
        {rightPanel}
      </div>
    </div>
  );
}
