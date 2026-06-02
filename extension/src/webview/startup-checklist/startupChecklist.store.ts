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
  dismissForSession: () => void;
  markComplete: (options?: { force?: boolean }) => void;
  isMarkedComplete: () => boolean;
  isSessionDismissed: () => boolean;
  shouldAutoShowOverlay: (args: {
    environmentReady: boolean;
    linkReady: boolean;
    assetsBusy: boolean;
    assetsNeedSetup: boolean;
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

  shouldAutoShowOverlay: ({ environmentReady, linkReady, assetsBusy, assetsNeedSetup }) => {
    if (get().panelOpen) {
      return true;
    }
    if (!environmentReady) {
      return true;
    }
    if (assetsBusy || assetsNeedSetup) {
      return true;
    }
    /**
     * First-run overlay: stay visible until the user dismisses or markComplete runs
     * (after the sequential walkthrough). Do not hide early when linkReady is already true.
     */
    if (!isStartupChecklistMarkedComplete() && !readStartupChecklistSessionDismissed()) {
      return true;
    }
    if (linkReady && isStartupChecklistMarkedComplete()) {
      return false;
    }
    if (!linkReady && !readStartupChecklistSessionDismissed()) {
      return true;
    }
    return false;
  },
}));
