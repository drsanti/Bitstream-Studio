/*******************************************************************************
 * File Name : BitstreamWebviewRoot.tsx
 *
 * Description : Webview entry — optional landing overlay, then {@link BitstreamApp}.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback } from "react";
import { BitstreamApp } from "../bitstream-shell/BitstreamApp.js";
import { WebviewRuntimeInstaller } from "../runtime/WebviewRuntimeInstaller";
import { QuickActionDialog } from "../ui/quick-action/QuickActionDialog";
import { SimulationHub } from "../simulations/SimulationHub.js";
import { useSimulationHubStore } from "../simulations/simulationHub.store.js";
import type { SimulationId } from "../simulations/catalog/simulationIds.js";
import { BitstreamLanding } from "./BitstreamLanding.js";
import { useBitstreamLandingStore } from "./bitstreamLanding.store.js";
import { useBitstreamLandingQuickCommands } from "./useBitstreamLandingQuickCommands.js";

/**
 * Shows the canvas landing when the store is visible, then the main app shell.
 */
export function BitstreamWebviewRoot()
{
  const landingVisible = useBitstreamLandingStore((s) => s.visible);
  const closeLanding = useBitstreamLandingStore((s) => s.closeLanding);
  const activeSimulationId = useSimulationHubStore((s) => s.activeSimulationId);
  const openSimulation = useSimulationHubStore((s) => s.openSimulation);

  useBitstreamLandingQuickCommands();

  const handleEnterWorkspace = useCallback(() =>
  {
    closeLanding();
  }, [closeLanding]);

  const handleOpenSimulation = useCallback(
    (id: SimulationId) =>
    {
      openSimulation(id);
      closeLanding();
    },
    [closeLanding, openSimulation],
  );

  return (
    <>
      <WebviewRuntimeInstaller />
      <QuickActionDialog />
      {activeSimulationId != null ? (
        <SimulationHub />
      ) : landingVisible ? (
        <BitstreamLanding
          onEnter={handleEnterWorkspace}
          onOpenSimulation={handleOpenSimulation}
        />
      ) : (
        <BitstreamApp />
      )}
    </>
  );
}
