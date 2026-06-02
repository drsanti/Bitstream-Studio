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
import {
  resolveStartupPresentationMode,
  useStartupChecklistPresentation,
} from "./useStartupChecklistPresentation.js";

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

  const assetsNeedSetup =
    bootstrap.phase === "blocked" || bootstrap.phase === "error";

  const panelActive = canUseHostedAssetBootstrap();
  const checklist = useStartupChecklist({ bootstrap, panelActive });
  const { linkReady, readyCount, totalCount, setExpandedId, steps } = checklist;

  const showOverlay =
    canUseHostedAssetBootstrap() &&
    (panelOpen ||
      shouldAutoShowOverlay({
        environmentReady,
        linkReady,
        assetsBusy,
        assetsNeedSetup,
      }));

  const presentationMode = resolveStartupPresentationMode({
    enabled: showOverlay && !panelOpen,
    userOpenedPanel: panelOpen,
  });
  const presentation = useStartupChecklistPresentation(steps, presentationMode);

  useEffect(() => {
    if (!presentation.isSequentialActive || presentation.focusStepId == null) {
      return;
    }
    setExpandedId(presentation.focusStepId);
  }, [presentation.focusStepId, presentation.isSequentialActive, setExpandedId]);

  /** Surface actionable steps when link checks fail (instant or after sequential reveal). */
  useEffect(() => {
    if (!showOverlay && !panelOpen) {
      return;
    }
    const handshake = steps.find((s) => s.id === "handshake");
    if (handshake?.status === "fail") {
      setExpandedId("handshake");
      return;
    }
    const serial = steps.find((s) => s.id === "serial-ports");
    if (serial?.status === "fail" || serial?.status === "warn") {
      setExpandedId("serial-ports");
    }
  }, [panelOpen, setExpandedId, showOverlay, steps]);

  const showIncompleteChip =
    canUseHostedAssetBootstrap() &&
    environmentReady &&
    !linkReady &&
    !showOverlay &&
    !assetsBusy;

  /**
   * Auto-dismiss only after the sequential walkthrough finishes (or instant mode).
   * Do not close when truth is already 8/8 but the UI is still on step 1.
   */
  useEffect(() => {
    if (useStartupChecklistStore.getState().panelOpen) {
      return;
    }
    if (!presentation.walkthroughComplete) {
      return;
    }
    if (environmentReady && linkReady && readyCount === totalCount && totalCount > 0) {
      markComplete();
    }
  }, [
    environmentReady,
    linkReady,
    markComplete,
    presentation.walkthroughComplete,
    readyCount,
    totalCount,
  ]);

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
            presentation={presentation}
            onDismiss={environmentReady ? handleDismiss : undefined}
            onFocusSerialPorts={() => setExpandedId("serial-ports")}
          />
        </div>
      ) : null}
    </>
  );
}
