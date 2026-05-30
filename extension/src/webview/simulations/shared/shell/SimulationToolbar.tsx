/*******************************************************************************
 * File Name : SimulationToolbar.tsx
 *
 * Description : Top bar for simulation apps (back + title).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { ArrowLeft } from "lucide-react";

export type SimulationToolbarProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

/**
 * Floating toolbar overlay for simulation fullscreen shell.
 */
export function SimulationToolbar({ title, subtitle, onBack }: SimulationToolbarProps)
{
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
      <button
        type="button"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-3 py-2 text-sm font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </button>
      <div className="pointer-events-none min-w-0 flex-1 text-right">
        <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
        {subtitle != null && subtitle.length > 0 ? (
          <p className="truncate text-xs text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
