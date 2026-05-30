/*******************************************************************************
 * File Name : E84RotationApp.tsx
 *
 * Description : PSoC E84 rotation simulation root (shell + scene + panels).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useMemo } from "react";
import { getSimulationMeta } from "../catalog/simulationCatalog.js";
import type { SimulationAppProps } from "../catalog/types.js";
import {
  SimulationAppShell,
  SimulationCanvas,
  SimulationSidePanel,
  resolveSimulationModelUrl,
} from "../shared/index.js";
import { E84RotationScene } from "./scene/E84RotationScene.js";
import { E84ControlPanel } from "./ui/E84ControlPanel.js";
import { E84MqttPanel } from "./ui/E84MqttPanel.js";

/**
 * E84 rotation simulation entry component.
 */
export function E84RotationApp({ onBack }: SimulationAppProps)
{
  const meta = getSimulationMeta("e84-rotation");
  const modelUrl = useMemo(
    () => resolveSimulationModelUrl(meta?.modelPath ?? "models/psoc-e84-ai/psoc-e84-ai.glb"),
    [meta?.modelPath],
  );

  return (
    <SimulationAppShell
      title={meta?.title ?? "E84 Rotation"}
      subtitle={meta?.subtitle}
      onBack={onBack}
      canvas={
        <SimulationCanvas>
          <E84RotationScene modelUrl={modelUrl} />
        </SimulationCanvas>
      }
      leftPanel={
        <SimulationSidePanel title="Simulation" side="left">
          <E84ControlPanel />
        </SimulationSidePanel>
      }
      rightPanel={
        <SimulationSidePanel title="MQTT" side="right">
          <E84MqttPanel />
        </SimulationSidePanel>
      }
    />
  );
}
