/*******************************************************************************
 * File Name : bitstreamLandingActions.ts
 *
 * Description : Landing navigation actions that depend on Zustand stores.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useBitstreamLandingStore } from "./bitstreamLanding.store.js";
import { useSimulationHubStore } from "../simulations/simulationHub.store.js";

/**
 * True when the landing overlay is the active root view (not hidden behind a sim).
 */
export function isWorkspaceLandingShown(): boolean
{
  return (
    useBitstreamLandingStore.getState().visible &&
    useSimulationHubStore.getState().activeSimulationId == null
  );
}

/** Leave sim or workspace and show the dev landing picker. */
export function returnToWorkspaceLanding(): void
{
  const hub = useSimulationHubStore.getState();
  if (hub.activeSimulationId != null)
  {
    hub.closeSimulation();
  }
  useBitstreamLandingStore.getState().openLanding();
}
