import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  areAllStartupStepsPassed,
  canCloseSetupOverlay,
} from "./startupChecklistCompletion.js";
import {
  resolveStartupPresentationMode,
  useStartupChecklistPresentation,
} from "./useStartupChecklistPresentation.js";
import { useWsClientStore } from "../ws-client-store.js";

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
  const endOverlaySession = useStartupChecklistStore((s) => s.endOverlaySession);

  const environmentReady =
    !shouldBlockShellUntilAssetsReady() || bootstrap.phase === "ready";
  const assetsBusy =
    bootstrap.phase === "checking" || bootstrap.phase === "syncing";

  const assetsNeedSetup =
    bootstrap.phase === "blocked" || bootstrap.phase === "error";

  const panelActive = canUseHostedAssetBootstrap();
  const checklist = useStartupChecklist({ bootstrap, panelActive });
  const { linkReady, setExpandedId, steps } = checklist;

  const wantsAutoOverlay =
    canUseHostedAssetBootstrap() &&
    shouldAutoShowOverlay({
      environmentReady,
      linkReady,
      assetsBusy,
      assetsNeedSetup,
    });

  const showOverlay = panelOpen || wantsAutoOverlay;

  const [tourResetGeneration, setTourResetGeneration] = useState(0);
  /** Manual open (Ctrl+/) uses instant mode until Recheck replays the guided tour. */
  const [recheckTourActive, setRecheckTourActive] = useState(false);

  const autoOverlayWalkthrough = showOverlay && !panelOpen;
  const sequentialFromRecheck = recheckTourActive && panelOpen;

  const presentationMode = resolveStartupPresentationMode({
    userOpenedPanel: panelOpen && !recheckTourActive,
    autoOverlay: autoOverlayWalkthrough || sequentialFromRecheck,
  });
  const presentation = useStartupChecklistPresentation(steps, presentationMode, tourResetGeneration);
  const canClose = canCloseSetupOverlay(steps, presentation);

  const [pointerInsideOverlay, setPointerInsideOverlay] = useState(false);
  const autoCloseScheduledRef = useRef(false);

  const handleRecheck = useCallback(() => {
    autoCloseScheduledRef.current = false;
    bootstrap.recheck();
    void useWsClientStore.getState().connect();
    setTourResetGeneration((g) => g + 1);
    if (panelOpen) {
      setRecheckTourActive(true);
    }
    setExpandedId("assets");
  }, [bootstrap, panelOpen, setExpandedId]);

  useEffect(() => {
    if (!recheckTourActive || !presentation.walkthroughComplete) {
      return;
    }
    setRecheckTourActive(false);
  }, [presentation.walkthroughComplete, recheckTourActive]);

  useEffect(() => {
    if (!presentation.isSequentialActive || presentation.focusStepId == null) {
      return;
    }
    setExpandedId(presentation.focusStepId);
  }, [presentation.focusStepId, presentation.isSequentialActive, setExpandedId]);

  useEffect(() => {
    if (!showOverlay && !panelOpen) {
      return;
    }
    if (presentation.isSequentialActive) {
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
  }, [panelOpen, presentation.isSequentialActive, setExpandedId, showOverlay, steps]);

  const handleDismiss = () => {
    autoCloseScheduledRef.current = false;
    endOverlaySession({
      markSetupComplete: presentation.walkthroughComplete,
    });
  };

  /** Auto-close when every step is green, walkthrough done, and the pointer left the overlay. */
  useEffect(() => {
    if (!showOverlay || panelOpen || pointerInsideOverlay) {
      autoCloseScheduledRef.current = false;
      return;
    }
    if (!presentation.walkthroughComplete || !areAllStartupStepsPassed(steps)) {
      autoCloseScheduledRef.current = false;
      return;
    }
    if (autoCloseScheduledRef.current) {
      return;
    }
    autoCloseScheduledRef.current = true;
    const timer = window.setTimeout(() => {
      endOverlaySession({ markSetupComplete: true });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      autoCloseScheduledRef.current = false;
    };
  }, [
    endOverlaySession,
    panelOpen,
    pointerInsideOverlay,
    presentation.walkthroughComplete,
    showOverlay,
    steps,
  ]);

  const showIncompleteChip =
    canUseHostedAssetBootstrap() &&
    environmentReady &&
    !linkReady &&
    !showOverlay &&
    !assetsBusy;

  return (
    <>
      {environmentReady ? children : null}
      {showIncompleteChip ? <StartupSetupIncompleteChip /> : null}
      {showOverlay ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="presentation"
          onPointerEnter={() => setPointerInsideOverlay(true)}
          onPointerLeave={() => setPointerInsideOverlay(false)}
        >
          <StartupChecklistPanel
            bootstrap={bootstrap}
            checklist={checklist}
            presentation={presentation}
            canClose={canClose}
            onDismiss={handleDismiss}
            onRecheck={handleRecheck}
            onFocusSerialPorts={() => setExpandedId("serial-ports")}
          />
        </div>
      ) : null}
    </>
  );
}
