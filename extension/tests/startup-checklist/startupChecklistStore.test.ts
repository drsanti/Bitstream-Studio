import assert from "node:assert/strict";
import test from "node:test";
import { useStartupChecklistStore } from "../../src/webview/startup-checklist/startupChecklist.store.js";
import {
  clearStartupChecklistSessionDismissed,
  markStartupChecklistComplete,
  STARTUP_CHECKLIST_VERSION,
  writeStartupChecklistCompletedVersion,
} from "../../src/webview/startup-checklist/startupChecklistPersistence.js";

const localStore = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      localStore.set(key, value);
    },
    removeItem: (key: string) => {
      localStore.delete(key);
    },
  },
});

const sessionStore = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => sessionStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      sessionStore.set(key, value);
    },
    removeItem: (key: string) => {
      sessionStore.delete(key);
    },
  },
});

test("shouldAutoShowOverlay stays open on first run when link is already ready", () => {
  localStore.clear();
  sessionStore.clear();
  useStartupChecklistStore.setState({ panelOpen: false });
  clearStartupChecklistSessionDismissed();

  const show = useStartupChecklistStore.getState().shouldAutoShowOverlay({
    environmentReady: true,
    linkReady: true,
    assetsBusy: false,
    assetsNeedSetup: false,
  });

  assert.equal(show, true);
});

test("shouldAutoShowOverlay skips after setup marked complete and environment ready", () => {
  localStore.clear();
  sessionStore.clear();
  writeStartupChecklistCompletedVersion(STARTUP_CHECKLIST_VERSION);
  useStartupChecklistStore.setState({ panelOpen: false });

  const show = useStartupChecklistStore.getState().shouldAutoShowOverlay({
    environmentReady: true,
    linkReady: true,
  });

  assert.equal(show, false);
});
