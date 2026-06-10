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

import { useCallback, type ReactNode } from "react";
import { BitstreamApp } from "../bitstream-shell/BitstreamApp.js";
import { WebGLRouteTransitionSplash } from "../shared/webgl/WebGLRouteTransitionSplash.js";
import { useWebGLSurfaceReady } from "../shared/webgl/webglSurfaceTransition.js";
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

  const landingRequested = landingVisible && activeSimulationId == null;
  const simulationRequested = activeSimulationId != null;
  const appRequested = !landingRequested && !simulationRequested;
  const landingReady = useWebGLSurfaceReady(landingRequested);
  const simulationReady = useWebGLSurfaceReady(simulationRequested);
  const appReady = useWebGLSurfaceReady(appRequested);

  const handleEnterWorkspace = useCallback(() =>
  {
    closeLanding();
  }, [closeLanding]);

  const handleOpenSimulation = useCallback(
    (id: SimulationId) =>
    {
      closeLanding();
      openSimulation(id);
    },
    [closeLanding, openSimulation],
  );

  let routeBody: ReactNode;

  if (simulationRequested)
  {
    routeBody = simulationReady ? (
      <SimulationHub key={activeSimulationId} />
    ) : (
      <WebGLRouteTransitionSplash
        label="Starting simulation…"
        hint="Handing off WebGL to the simulation hub."
      />
    );
  }
  else if (landingRequested)
  {
    routeBody = landingReady ? (
      <BitstreamLanding
        key="bitstream-workspace-landing"
        onEnter={handleEnterWorkspace}
        onOpenSimulation={handleOpenSimulation}
      />
    ) : (
      <WebGLRouteTransitionSplash
        label="Loading workspace…"
        hint="Preparing the landing canvas and 3D scene."
      />
    );
  }
  else if (appRequested)
  {
    routeBody = appReady ? (
      <BitstreamApp />
    ) : (
      <WebGLRouteTransitionSplash
        label="Opening workspace…"
        hint="Loading the Bitstream shell and telemetry services."
      />
    );
  }
  else
  {
    routeBody = null;
  }

  return (
    <>
      <WebviewRuntimeInstaller />
      <QuickActionDialog />
      {routeBody}
    </>
  );
}
