/*******************************************************************************
 * File Name : landingCss3dRegistry.store.ts
 *
 * Description : DOM card registrations for the landing CSS3D overlay.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { LandingCss3dSlotLayout } from "./landingCss3dLayout.js";

export type LandingCss3dCardRegistration = {
  id: string;
  element: HTMLElement;
  anchor: HTMLElement;
  layout: LandingCss3dSlotLayout;
};

export type LandingCss3dRegistryStoreState = {
  cards: Record<string, LandingCss3dCardRegistration>;
  registerCard: (entry: LandingCss3dCardRegistration) => void;
  unregisterCard: (id: string) => void;
  clearCards: () => void;
};

/**
 * Card slots register on mount; {@link LandingCss3dOverlay} attaches CSS3DObjects.
 */
export const useLandingCss3dRegistryStore = create<LandingCss3dRegistryStoreState>((set) => ({
  cards: {},

  registerCard: (entry) =>
  {
    set((state) => ({
      cards: { ...state.cards, [entry.id]: entry },
    }));
  },

  unregisterCard: (id) =>
  {
    set((state) =>
    {
      const next = { ...state.cards };
      delete next[id];
      return { cards: next };
    });
  },

  clearCards: () =>
  {
    set({ cards: {} });
  },
}));
