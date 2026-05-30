import {
  readBitstreamWorkspaceFromUrl,
  useBitstreamWorkspaceModeStore,
} from "../bitstream-app/state/bitstreamWorkspaceMode.store.js";
import { getWebviewEntryStore } from "./webviewEntry.store.js";
import { readShellStateFromUrl } from "./webviewShellUrl.js";
import { teardownBeforeShellSwitch, teardownBitstreamShell } from "./webviewShellTeardown.js";

/** Apply URL-derived shell state to the zustand store (with teardown when the surface changes). */
export function applyShellStateFromUrl(href?: string): boolean {
  const desired = readShellStateFromUrl(href);
  if (desired == null) {
    return false;
  }

  const store = getWebviewEntryStore();
  const current = store.getState();
  const workspace = desired.entry === "bitstream" ? readBitstreamWorkspaceFromUrl() : null;

  const sameSurface =
    current.showLauncher === desired.showLauncher && current.entry === desired.entry;

  if (sameSurface) {
    if (desired.entry === "bitstream" && workspace != null) {
      const curWs = useBitstreamWorkspaceModeStore.getState().workspace;
      if (curWs !== workspace) {
        teardownBitstreamShell();
        useBitstreamWorkspaceModeStore.setState({ workspace });
      }
    }
    return false;
  }

  if (!current.showLauncher) {
    teardownBeforeShellSwitch({
      fromEntry: current.entry,
      fromLauncher: false,
    });
  } else {
    teardownBeforeShellSwitch({
      fromEntry: current.entry,
      fromLauncher: true,
    });
  }

  if (desired.entry === "bitstream" && workspace != null) {
    useBitstreamWorkspaceModeStore.setState({ workspace });
  }

  store.setState({
    entry: desired.entry,
    showLauncher: desired.showLauncher,
  });

  return true;
}

let urlSyncInstalled = false;

/** Keep store aligned when the user edits the address bar or uses browser Back/Forward. */
export function installWebviewShellUrlSync(): void {
  if (urlSyncInstalled || typeof window === "undefined") {
    return;
  }
  if (readShellStateFromUrl() == null) {
    return;
  }
  urlSyncInstalled = true;
  window.addEventListener("popstate", () => {
    applyShellStateFromUrl();
  });
}
