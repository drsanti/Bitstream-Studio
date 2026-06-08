import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { useConnectionPanelStore } from "../bitstream-app/connection/connectionPanel.store.js";
import { useSystemDiagnosticsUiStore } from "../bitstream-shell/state/systemDiagnosticsUi.store.js";
import type { StartupStepRecoveryAction } from "./StartupStepCard.js";
import type { StartupStepId } from "./startup-step-meta.js";

const C = ternionFreeAssetPackCopy.checklist;

/** Inline recovery button for a failed/warn setup step (opens the right operator window). */
export function getStartupStepRecoveryAction(
  stepId: StartupStepId,
): StartupStepRecoveryAction | undefined {
  switch (stepId) {
    case "bridge":
      return {
        label: C.openRuntimeServices,
        hint: C.openRuntimeServicesHint,
        onClick: () => {
          useSystemDiagnosticsUiStore.getState().openPanel();
        },
      };
    case "websocket":
      return {
        label: C.openConnectionSetup,
        hint: C.openConnectionSetupHint,
        onClick: () => {
          useConnectionPanelStore.getState().openPanel("websocket");
        },
      };
    default:
      return undefined;
  }
}
