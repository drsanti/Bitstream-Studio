/*******************************************************************************
 * File Name : bitstreamLanding.store.ts
 *
 * Description : Zustand store for workspace landing overlay visibility (dev + VSIX).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import { readSimulationIdFromUrl } from "../simulations/catalog/simulationRoutes.js";
import { shouldShowBitstreamLanding } from "./bitstreamLandingNav.js";

export type BitstreamLandingStoreState = {
  visible: boolean;
  openLanding: () => void;
  closeLanding: () => void;
};

function readInitialLandingVisible(): boolean
{
  if (readSimulationIdFromUrl() != null)
  {
    return false;
  }
  return shouldShowBitstreamLanding();
}

export const useBitstreamLandingStore = create<BitstreamLandingStoreState>((set) => ({
  visible: readInitialLandingVisible(),

  openLanding: () =>
  {
    set({ visible: true });
  },

  closeLanding: () =>
  {
    set({ visible: false });
  },
}));
