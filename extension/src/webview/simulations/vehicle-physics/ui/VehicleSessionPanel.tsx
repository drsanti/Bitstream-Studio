/*******************************************************************************
 * File Name : VehicleSessionPanel.tsx
 *
 * Description : Left panel: session controls + camera feed (Phase 3d layout).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useVehicleSetupContext } from "../context/VehicleSetupContext.js";
import { VehicleCameraFeedPanel } from "./VehicleCameraFeedPanel.js";
import { VehiclePhysicsControlsPanel } from "./VehiclePhysicsControlsPanel.js";

/**
 * Combines physics session controls and onboard camera feed for the left sidebar.
 */
export function VehicleSessionPanel()
{
  const {
    vehicleCameraRef,
    feedCanvasRef,
    feedCanvasContainerRef,
    feedCanvasSize,
    targetFpsRef,
  } = useVehicleSetupContext();

  return (
    <div className="flex flex-col gap-4 p-1 text-sm text-zinc-200">
      <VehiclePhysicsControlsPanel />
      <hr className="border-zinc-700/60" />
      <VehicleCameraFeedPanel
        canvasRef={feedCanvasRef}
        canvasContainerRef={feedCanvasContainerRef}
        canvasSize={feedCanvasSize}
        vehicleCameraRef={vehicleCameraRef}
        targetFpsRef={targetFpsRef}
      />
    </div>
  );
}
