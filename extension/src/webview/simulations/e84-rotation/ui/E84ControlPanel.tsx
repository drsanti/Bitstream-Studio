/*******************************************************************************
 * File Name : E84ControlPanel.tsx
 *
 * Description : E84 left panel — Simulation / Manual tabs (TRN).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Move3d, Play } from "lucide-react";
import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "../../../ui/TRN/index.js";
import { useE84MovementStore } from "../store/e84Movement.store.js";
import { E84ManualPanel } from "./E84ManualPanel.js";
import { E84SimulationPanel } from "./E84SimulationPanel.js";

/**
 * Left panel: mode tabs and per-mode controls.
 */
export function E84ControlPanel()
{
  const uiMode = useE84MovementStore((s) => s.uiMode);
  const setUiMode = useE84MovementStore((s) => s.setUiMode);

  return (
    <TRNTabs value={uiMode} onValueChange={(v) => setUiMode(v as "simulation" | "manual")}>
      <TRNTabsList className="mb-3 w-full">
        <TRNTabsTrigger value="simulation" className="flex-1 gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Simulation
        </TRNTabsTrigger>
        <TRNTabsTrigger value="manual" className="flex-1 gap-1.5">
          <Move3d className="h-3.5 w-3.5" />
          Manual
        </TRNTabsTrigger>
      </TRNTabsList>
      <TRNTabsContent value="simulation">
        <E84SimulationPanel />
      </TRNTabsContent>
      <TRNTabsContent value="manual">
        <E84ManualPanel />
      </TRNTabsContent>
    </TRNTabs>
  );
}
