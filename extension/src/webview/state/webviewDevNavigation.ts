import { getWebviewEntryStore } from "./webviewEntry.store";
import { teardownBeforeShellSwitch } from "./webviewShellTeardown.js";
import { isBrowserShellEnvironment, writeShellUrl } from "./webviewShellUrl.js";

/** Browser dev: open the application launcher (`/?launcher=1`). */
export function navigateToDevLauncher(): void {
  if (!isBrowserShellEnvironment()) {
    return;
  }
  const store = getWebviewEntryStore();
  const state = store.getState();
  if (!state.showLauncher) {
    teardownBeforeShellSwitch({
      fromEntry: state.entry,
      fromLauncher: false,
    });
  }
  store.setState({ showLauncher: true });
  writeShellUrl({
    showLauncher: true,
    entry: state.entry,
  });
}
