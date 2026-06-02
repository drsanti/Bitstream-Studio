import { create } from "zustand";
import {
  clearStartupChecklistSessionDismissed,
  isStartupChecklistMarkedComplete,
  markStartupChecklistComplete,
  readStartupChecklistSessionDismissed,
  writeStartupChecklistSessionDismissed,
} from "./startupChecklistPersistence.js";

type StartupChecklistState = {
  /** True when the user explicitly opened the checklist (Ctrl+/, chip, missing-asset flow). */
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  /** User closed the auto overlay (×). Persists setup-complete when requested. */
  endOverlaySession: (options?: { markSetupComplete?: boolean }) => void;
  dismissForSession: () => void;
  markComplete: (options?: { force?: boolean }) => void;
  isMarkedComplete: () => boolean;
  isSessionDismissed: () => boolean;
  shouldAutoShowOverlay: (args: {
    environmentReady: boolean;
    /** Kept for call-site stability; first-run overlay no longer depends on link/assets flags. */
    linkReady?: boolean;
    assetsBusy?: boolean;
    assetsNeedSetup?: boolean;
  }) => boolean;
};

export const useStartupChecklistStore = create<StartupChecklistState>((set, get) => ({
  panelOpen: false,

  openPanel: () => {
    set({ panelOpen: true });
  },

  closePanel: () => {
    set({ panelOpen: false });
  },

  endOverlaySession: (options) => {
    if (options?.markSetupComplete) {
      markStartupChecklistComplete();
      clearStartupChecklistSessionDismissed();
    } else {
      writeStartupChecklistSessionDismissed();
    }
    set({ panelOpen: false });
  },

  dismissForSession: () => {
    writeStartupChecklistSessionDismissed();
    set({ panelOpen: false });
  },

  markComplete: (options) => {
    if (!options?.force && get().panelOpen) {
      return;
    }
    markStartupChecklistComplete();
    clearStartupChecklistSessionDismissed();
    set({ panelOpen: false });
  },

  isMarkedComplete: () => isStartupChecklistMarkedComplete(),

  isSessionDismissed: () => readStartupChecklistSessionDismissed(),

  shouldAutoShowOverlay: ({ environmentReady }) => {
    if (get().panelOpen) {
      return true;
    }
    if (readStartupChecklistSessionDismissed()) {
      return false;
    }
    if (isStartupChecklistMarkedComplete()) {
      return !environmentReady;
    }
    // First run: keep overlay mounted until walkthrough + dismiss, even when all checks are already green.
    return true;
  },
}));
