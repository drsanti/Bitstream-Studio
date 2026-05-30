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

  const sameSurface =
    current.showLauncher === desired.showLauncher && current.entry === desired.entry;

  if (sameSurface)
  {
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

  if (desired.entry === "bitstream")
  {
    teardownBitstreamShell();
  }

  store.setState({
    entry: desired.entry,
    showLauncher: desired.showLauncher,
  });

  return true;
}

/** @deprecated Bitstream Studio no longer syncs shell state from the URL bar. */
export function installWebviewShellUrlSync(): void
{
  // intentionally empty
}
