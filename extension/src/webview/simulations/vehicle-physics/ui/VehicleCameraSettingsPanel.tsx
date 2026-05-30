/*******************************************************************************
 * File Name : VehicleCameraSettingsPanel.tsx
 *
 * Description : Vehicle onboard camera FOV, render target, and offsets (TRN).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Camera, Eye } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNFormField,
  TRNParameterSlider,
  TRNToggleSwitch,
} from "../../../ui/TRN/index.js";
import { useCameraSettingsStore } from "../store/camera-settings-store.js";
import type { VehicleCamera } from "../vehicle/VehicleCamera.js";

export type VehicleCameraSettingsPanelProps = {
  vehicleCameraRef: RefObject<VehicleCamera | null>;
  targetFpsRef?: RefObject<number>;
};

const RENDER_SIZES = [128, 256, 512] as const;

/**
 * Live-tune vehicle camera render target and mount offsets.
 */
export function VehicleCameraSettingsPanel({
  vehicleCameraRef,
  targetFpsRef,
}: VehicleCameraSettingsPanelProps)
{
  const {
    fov,
    width,
    targetFps,
    positionOffset,
    lookAtOffset,
    showHelper,
    setFov: setFovStore,
    setSize: setSizeStore,
    setTargetFps: setTargetFpsStore,
    setPositionOffset: setPositionOffsetStore,
    setLookAtOffset: setLookAtOffsetStore,
    setShowHelper: setShowHelperStore,
  } = useCameraSettingsStore();

  const appliedInitialRef = useRef(false);

  useEffect(() => {
    if (targetFpsRef)
    {
      targetFpsRef.current = targetFps;
    }
  }, [targetFps, targetFpsRef]);

  /* Apply persisted store values when camera becomes available */
  useEffect(() => {
    const camera = vehicleCameraRef.current;
    if (!camera || appliedInitialRef.current)
    {
      return;
    }
    camera.setFov(fov);
    camera.setSize(width, width);
    camera.setPositionOffset(
      positionOffset.x,
      positionOffset.y,
      positionOffset.z,
    );
    camera.setLookAtOffset(
      lookAtOffset.x,
      lookAtOffset.y,
      lookAtOffset.z,
    );
    if (showHelper)
    {
      camera.showHelper();
    }
    else
    {
      camera.hideHelper();
    }
    appliedInitialRef.current = true;
  }, [
    vehicleCameraRef,
    fov,
    width,
    positionOffset,
    lookAtOffset,
    showHelper,
  ]);

  useEffect(() => {
    if (!vehicleCameraRef.current)
    {
      appliedInitialRef.current = false;
    }
  }, [vehicleCameraRef]);

  const handleFovChange = useCallback(
    (value: number) => {
      setFovStore(value);
      vehicleCameraRef.current?.setFov(value);
    },
    [setFovStore, vehicleCameraRef],
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      setSizeStore(size, size);
      vehicleCameraRef.current?.setSize(size, size);
    },
    [setSizeStore, vehicleCameraRef],
  );

  const handlePositionAxis = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      const updated = { ...positionOffset, [axis]: value };
      setPositionOffsetStore(updated);
      vehicleCameraRef.current?.setPositionOffset(
        updated.x,
        updated.y,
        updated.z,
      );
    },
    [positionOffset, setPositionOffsetStore, vehicleCameraRef],
  );

  const handleLookAtAxis = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      const updated = { ...lookAtOffset, [axis]: value };
      setLookAtOffsetStore(updated);
      vehicleCameraRef.current?.setLookAtOffset(
        updated.x,
        updated.y,
        updated.z,
      );
    },
    [lookAtOffset, setLookAtOffsetStore, vehicleCameraRef],
  );

  return (
    <TRNAccordion type="multiple" defaultValue={["render", "camera"]}>
      <TRNAccordionItem value="render">
        <TRNAccordionTrigger className="text-xs">
          <span className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5" />
            Render target
          </span>
        </TRNAccordionTrigger>
        <TRNAccordionContent className="space-y-3">
          <TRNParameterSlider
            name="Feed FPS"
            value={targetFps}
            min={0}
            max={60}
            step={5}
            valueFormatter={(v) => (v === 0 ? "Unlimited" : `${v} FPS`)}
            onChange={setTargetFpsStore}
          />
          <TRNFormField label="Render size">
            <div className="flex flex-wrap gap-2">
              {RENDER_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`rounded border px-2 py-1 text-xs ${
                    width === size
                      ? "border-sky-500/80 bg-sky-950/50 text-sky-100"
                      : "border-zinc-600/80 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/80"
                  }`}
                  onClick={() => handleSizeChange(size)}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </TRNFormField>
        </TRNAccordionContent>
      </TRNAccordionItem>

      <TRNAccordionItem value="camera">
        <TRNAccordionTrigger className="text-xs">
          <span className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            Camera mount
          </span>
        </TRNAccordionTrigger>
        <TRNAccordionContent className="space-y-3">
          <TRNParameterSlider
            name="Field of view"
            value={fov}
            min={10}
            max={120}
            step={1}
            valueFormatter={(v) => `${Math.round(v)}°`}
            onChange={handleFovChange}
          />
          <TRNFormField label="Show camera helper">
            <TRNToggleSwitch
              checked={showHelper}
              onCheckedChange={(checked) => {
                setShowHelperStore(checked);
                const cam = vehicleCameraRef.current;
                if (!cam)
                {
                  return;
                }
                if (checked)
                {
                  cam.showHelper();
                }
                else
                {
                  cam.hideHelper();
                }
              }}
              ariaLabel="Show camera helper"
            />
          </TRNFormField>
          <p className="text-[11px] font-medium text-zinc-400">Position offset (m)</p>
          {(["x", "y", "z"] as const).map((axis) => (
            <TRNParameterSlider
              key={`pos-${axis}`}
              name={`Pos ${axis.toUpperCase()}`}
              value={positionOffset[axis]}
              min={-5}
              max={5}
              step={0.1}
              valueFormatter={(v) => v.toFixed(1)}
              onChange={(v) => handlePositionAxis(axis, v)}
            />
          ))}
          <p className="text-[11px] font-medium text-zinc-400">Look-at offset (m)</p>
          {(["x", "y", "z"] as const).map((axis) => (
            <TRNParameterSlider
              key={`look-${axis}`}
              name={`Look ${axis.toUpperCase()}`}
              value={lookAtOffset[axis]}
              min={-10}
              max={10}
              step={0.1}
              valueFormatter={(v) => v.toFixed(1)}
              onChange={(v) => handleLookAtAxis(axis, v)}
            />
          ))}
        </TRNAccordionContent>
      </TRNAccordionItem>
    </TRNAccordion>
  );
}
