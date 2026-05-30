/*******************************************************************************
 * File Name : VehicleCameraFeedPanel.tsx
 *
 * Description : Onboard vehicle camera preview canvas (Phase 3d).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Video } from "lucide-react";
import type { RefObject } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNHintText,
} from "../../../ui/TRN/index.js";
import { useVehicleSetupContext } from "../context/VehicleSetupContext.js";
import { useCameraSettingsStore } from "../store/camera-settings-store.js";
import type { VehicleCamera } from "../vehicle/VehicleCamera.js";
import { VehicleCameraSettingsPanel } from "./VehicleCameraSettingsPanel.js";

export type VehicleCameraFeedPanelProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  canvasSize: { width: number; height: number };
  vehicleCameraRef: RefObject<VehicleCamera | null>;
  targetFpsRef: RefObject<number>;
};

/**
 * Left-panel camera feed preview and settings (no WebRTC in v1).
 */
export function VehicleCameraFeedPanel({
  canvasRef,
  canvasContainerRef,
  canvasSize,
  vehicleCameraRef,
  targetFpsRef,
}: VehicleCameraFeedPanelProps)
{
  const { physicsReady } = useVehicleSetupContext();
  const { width: renderWidth } = useCameraSettingsStore();

  if (!physicsReady)
  {
    return (
      <TRNHintText>
        Start physics and wait for the vehicle to load to see the onboard camera feed.
      </TRNHintText>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TRNAccordion type="multiple" defaultValue={["feed", "settings"]}>
        <TRNAccordionItem value="feed">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5" />
              Camera feed
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <div
              ref={canvasContainerRef}
              className="flex w-full justify-center py-2"
            >
              <canvas
                ref={canvasRef}
                className="max-w-full rounded border border-zinc-600/80 bg-black"
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                  display: "block",
                  imageRendering: "auto",
                }}
              />
            </div>
            <p className="text-center text-[11px] text-zinc-500">
              Render target {renderWidth}×{renderWidth}
            </p>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="settings">
          <TRNAccordionTrigger className="text-xs">
            Camera settings
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <VehicleCameraSettingsPanel
              vehicleCameraRef={vehicleCameraRef}
              targetFpsRef={targetFpsRef}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}
