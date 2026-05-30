/*******************************************************************************
 * File Name : telemetryWorkbenchUi.store.ts
 *
 * Description : Reset-layout handler bridge between Sensor Telemetry workbench
 *               and shell header menu.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";

interface TelemetryWorkbenchUiState {
  resetLayout: (() => void) | null;
  setResetLayoutHandler: (handler: (() => void) | null) => void;
  invokeResetLayout: () => void;
}

export const useTelemetryWorkbenchUiStore = create<TelemetryWorkbenchUiState>((set, get) => ({
  resetLayout: null,
  setResetLayoutHandler: (handler) => {
    set({ resetLayout: handler });
  },
  invokeResetLayout: () => {
    get().resetLayout?.();
  },
}));
