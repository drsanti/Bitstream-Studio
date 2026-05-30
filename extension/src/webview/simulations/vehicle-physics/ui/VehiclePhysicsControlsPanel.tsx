/*******************************************************************************
 * File Name : VehiclePhysicsControlsPanel.tsx
 *
 * Description : Start physics + driving hints for vehicle simulation.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { TRNButton } from "../../../ui/TRN/TRNButton.js";
import { TRNHintText } from "../../../ui/TRN/TRNHintText.js";
import { useVehiclePhysics } from "../context/VehiclePhysicsContext.js";
import { VehicleDrivingKeysCard } from "./VehicleDrivingKeysCard.js";

/**
 * Side panel: load Jolt, pause/resume, and WASD control hints.
 */
export function VehiclePhysicsControlsPanel()
{
  const {
    loadState,
    loadError,
    startPhysics,
    setRunning,
    isRunning,
    engine,
  } = useVehiclePhysics();

  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-zinc-200">
      <TRNHintText>
        Load Jolt WASM (single-thread, webview-safe), then drive with WASD / arrows.
        Space or Z = hand brake.
      </TRNHintText>

      {loadState === "idle" && (
        <TRNButton variant="primary" onClick={() => void startPhysics()}>
          Start physics
        </TRNButton>
      )}

      {loadState === "loading" && (
        <p className="text-zinc-400">Loading Jolt Physics…</p>
      )}

      {loadState === "error" && (
        <p className="text-red-400">
          {loadError ?? "Failed to load physics"}
        </p>
      )}

      {engine && loadState === "ready" && (
        <TRNButton
          variant="secondary"
          onClick={() => setRunning(!isRunning)}
        >
          {isRunning ? "Pause simulation" : "Resume simulation"}
        </TRNButton>
      )}

      <VehicleDrivingKeysCard />
    </div>
  );
}
