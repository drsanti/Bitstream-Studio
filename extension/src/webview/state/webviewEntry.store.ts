import { useQuickSceneStore } from "@ternion/t3d";
import { create } from "zustand";
import type { TernionWebviewEntry } from "../ternion-webview-entry.js";
import {
  persistWebviewEntry,
  normalizeShellEntry,
  isTernionWebviewEntry,
  type WebviewShellEntry,
} from "./webviewEntryPersistence.js";
export {
  readPersistedWebviewEntry,
  normalizeShellEntry,
  isTernionWebviewEntry,
  type WebviewShellEntry,
} from "./webviewEntryPersistence.js";
import {
  isBrowserShellEnvironment,
  writeShellUrl,
} from "./webviewShellUrl.js";
import {
  teardownBeforeShellSwitch,
  teardownBitstreamShell,
} from "./webviewShellTeardown.js";

function syncShellUrlFromStore(
  entry: WebviewShellEntry,
  showLauncher: boolean,
  usePushState = false,
): void {
  if (!isBrowserShellEnvironment()) {
    return;
  }
  writeShellUrl({
    showLauncher,
    entry,
    usePushState,
  });
}

function shouldConfirmLeaveDigitalTwin(): boolean {
  const qs = useQuickSceneStore.getState();
  return qs.currentApplicationComponent != null || qs.currentModel != null;
}

type WebviewEntryState = {
  entry: WebviewShellEntry;
  showLauncher: boolean;
  setEntry: (next: WebviewShellEntry) => void;
  requestEntrySwitch: (next: WebviewShellEntry) => boolean;
  requestBitstreamEntrySwitch: () => boolean;
  dismissLauncher: () => void;
};

export function createWebviewEntryStore(initialEntry: WebviewShellEntry, showLauncher: boolean) {
  return create<WebviewEntryState>((set, get) => ({
    entry: initialEntry,
    showLauncher,
    setEntry: (next) => {
      const state = get();
      if (state.entry === next && !state.showLauncher) {
        syncShellUrlFromStore(next, false);
        return;
      }
      teardownBeforeShellSwitch({
        fromEntry: state.entry,
        fromLauncher: state.showLauncher,
      });
      set({ entry: next, showLauncher: false });
      persistWebviewEntry(next);
      syncShellUrlFromStore(next, false);
    },
    requestEntrySwitch: (next) => {
      const state = get();
      if (state.showLauncher) {
        teardownBeforeShellSwitch({
          fromEntry: state.entry,
          fromLauncher: true,
        });
        set({ entry: next, showLauncher: false });
        persistWebviewEntry(next);
        syncShellUrlFromStore(next, false);
        return true;
      }
      if (state.entry === next) {
        syncShellUrlFromStore(next, false);
        return true;
      }
      if (
        state.entry === "digitalTwin" &&
        next !== "digitalTwin" &&
        shouldConfirmLeaveDigitalTwin()
      ) {
        const skipConfirm =
          typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
        if (!skipConfirm) {
          const ok = window.confirm(
            "Leave Digital Twin (3D World)? The active quick scene will unload and the 3D engine will stop.",
          );
          if (!ok) {
            return false;
          }
        }
      }
      get().setEntry(next);
      return true;
    },
    requestBitstreamEntrySwitch: (workspace) => {
      const state = get();
      if (state.showLauncher) {
        return get().requestEntrySwitch("bitstream");
      }
      if (state.entry === "bitstream") {
        persistWebviewEntry("bitstream");
        syncShellUrlFromStore("bitstream", false);
        return true;
      }
      return get().requestEntrySwitch("bitstream");
    },
    dismissLauncher: () => {
      if (!get().showLauncher) {
        return;
      }
      set({ showLauncher: false });
    },
  }));
}

let webviewEntryStore: ReturnType<typeof createWebviewEntryStore> | null = null;

export function getWebviewEntryStore() {
  if (webviewEntryStore == null) {
    throw new Error("Webview entry store not initialized — call initWebviewEntryStore first");
  }
  return webviewEntryStore;
}

export function initWebviewEntryStore(
  initialEntry: WebviewShellEntry,
  options?: { showLauncher?: boolean },
) {
  webviewEntryStore = createWebviewEntryStore(initialEntry, options?.showLauncher ?? false);
  return webviewEntryStore;
}

export function useWebviewEntryStore<T>(selector: (state: WebviewEntryState) => T): T {
  return getWebviewEntryStore()(selector);
}
