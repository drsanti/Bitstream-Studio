import { useEffect, type ReactNode } from "react";
import { useAssetBootstrap } from "../asset-bootstrap/useAssetBootstrap.js";
import {
  canUseHostedAssetBootstrap,
  shouldBlockShellUntilAssetsReady,
} from "../webviewHostCapabilities.js";
import { useStartupChecklistStore } from "./startupChecklist.store.js";
import { StartupChecklistPanel } from "./StartupChecklistPanel.js";
import { StartupSetupIncompleteChip } from "./StartupSetupIncompleteChip.js";
import { useStartupChecklist } from "./useStartupChecklist.js";

type StartupChecklistGateProps = {
  children: ReactNode;
};

/**
 * Blocks the workspace shell until required assets are on disk (VSIX), then guides
 * link setup via the checklist overlay (auto or Ctrl+/).
 */
export function StartupChecklistGate(props: StartupChecklistGateProps) {
  const { children } = props;
  const bootstrap = useAssetBootstrap();

  const panelOpen = useStartupChecklistStore((s) => s.panelOpen);
  const shouldAutoShowOverlay = useStartupChecklistStore((s) => s.shouldAutoShowOverlay);
  const markComplete = useStartupChecklistStore((s) => s.markComplete);
  const dismissForSession = useStartupChecklistStore((s) => s.dismissForSession);
  const closePanel = useStartupChecklistStore((s) => s.closePanel);

  const environmentReady =
    !shouldBlockShellUntilAssetsReady() || bootstrap.phase === "ready";
  const assetsBusy =
    bootstrap.phase === "checking" || bootstrap.phase === "syncing";

  const panelActive = canUseHostedAssetBootstrap();
  const checklist = useStartupChecklist({ bootstrap, panelActive });
  const { linkReady, readyCount, totalCount, setExpandedId } = checklist;

  const assetsNeedSetup =
    bootstrap.phase === "blocked" || bootstrap.phase === "error";

  const showOverlay =
    canUseHostedAssetBootstrap() &&
    (panelOpen ||
      shouldAutoShowOverlay({
        environmentReady,
        linkReady,
        assetsBusy,
        assetsNeedSetup,
      }));

  const showIncompleteChip =
    canUseHostedAssetBootstrap() &&
    environmentReady &&
    !linkReady &&
    !showOverlay &&
    !assetsBusy;

  /** Auto-dismiss only for the first-run overlay — not when the user opened via Ctrl+/ or the chip. */
  useEffect(() => {
    if (useStartupChecklistStore.getState().panelOpen) {
      return;
    }
    if (environmentReady && linkReady && readyCount === totalCount && totalCount > 0) {
      markComplete();
    }
  }, [environmentReady, linkReady, markComplete, readyCount, totalCount]);

  const handleDismiss = () => {
    if (linkReady) {
      markComplete({ force: true });
    } else {
      dismissForSession();
    }
    closePanel();
  };

  return (
    <>
      {environmentReady ? children : null}
      {showIncompleteChip ? <StartupSetupIncompleteChip /> : null}
      {showOverlay ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="presentation"
        >
          <StartupChecklistPanel
            bootstrap={bootstrap}
            checklist={checklist}
            onDismiss={environmentReady ? handleDismiss : undefined}
            onFocusSerialPorts={() => setExpandedId("serial-ports")}
          />
        </div>
      ) : null}
    </>
  );
}
