/*******************************************************************************
 * File Name : SimulationStubPanel.tsx
 *
 * Description : Placeholder panel for simulations not yet fully ported.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type SimulationStubPanelProps = {
  phaseLabel: string;
  notes: string;
};

/**
 * Informs the user that the simulation is scaffolded but not feature-complete.
 */
export function SimulationStubPanel({ phaseLabel, notes }: SimulationStubPanelProps)
{
  return (
    <div className="flex flex-col gap-3 text-sm text-zinc-300">
      <p className="rounded-md border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
        {phaseLabel}
      </p>
      <p className="text-xs leading-relaxed text-zinc-400">{notes}</p>
    </div>
  );
}
