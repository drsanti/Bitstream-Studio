/*******************************************************************************
 * File Name : useBitstreamLandingQuickCommands.ts
 *
 * Description : Ctrl+/ commands for the workspace landing overlay.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useLayoutEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { useQuickAction } from "@/ui/quick-action/useQuickAction";
import { useBitstreamLandingStore } from "./bitstreamLanding.store.js";
import { useSimulationHubStore } from "../simulations/simulationHub.store.js";
import { returnToWorkspaceLanding } from "./bitstreamLandingActions.js";

/**
 * Registers landing palette commands (mounted from {@link BitstreamWebviewRoot}).
 */
export function useBitstreamLandingQuickCommands(): void
{
  const { registerCommand, unregisterCommand } = useQuickAction();
  const landingVisible = useBitstreamLandingStore((s) => s.visible);
  const activeSimulationId = useSimulationHubStore((s) => s.activeSimulationId);
  const landingShown = landingVisible && activeSimulationId == null;

  useLayoutEffect(() =>
  {
    registerCommand({
      id: "bitstream-open-landing",
      label: "Open workspace landing",
      category: "Workspace",
      icon: LayoutGrid,
      keywords: [
        "landing",
        "home",
        "start",
        "picker",
        "workspace",
        "choose",
        "sensor",
        "telemetry",
        "studio",
        "simulation",
        "sim",
        "back",
      ],
      disabled: landingShown,
      action: () => {
        returnToWorkspaceLanding();
      },
    });

    return () =>
    {
      unregisterCommand("bitstream-open-landing");
    };
  }, [landingShown, registerCommand, unregisterCommand]);
}
