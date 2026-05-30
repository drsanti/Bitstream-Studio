/*******************************************************************************
 * File Name : simulationHub.store.ts
 *
 * Description : Active Digital Twin simulation id (null = not in sim hub).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import { readSimulationIdFromUrl } from "./catalog/simulationRoutes.js";
import { commitSimulationUrl, clearSimulationUrl } from "./catalog/simulationRoutes.js";
import type { SimulationId } from "./catalog/simulationIds.js";

export type SimulationHubStoreState = {
  activeSimulationId: SimulationId | null;
  openSimulation: (id: SimulationId) => void;
  closeSimulation: () => void;
};

function readInitialSimulationId(): SimulationId | null
{
  if (typeof window !== "undefined" && window.WEBVIEW_READY === true)
  {
    return null;
  }
  return readSimulationIdFromUrl();
}

export const useSimulationHubStore = create<SimulationHubStoreState>((set) => ({
  activeSimulationId: readInitialSimulationId(),

  openSimulation: (id) =>
  {
    commitSimulationUrl(id);
    set({ activeSimulationId: id });
  },

  closeSimulation: () =>
  {
    clearSimulationUrl();
    set({ activeSimulationId: null });
  },
}));
