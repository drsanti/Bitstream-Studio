/*******************************************************************************
 * File Name : AbbRobotApp.tsx
 *
 * Description : ABB robot simulation root (GSAP joints + MQTT).
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
import { AbbRobotProvider } from "./context/AbbRobotContext.js";
import { AbbMqttProvider } from "./context/AbbMqttProvider.js";
import { AbbRobotScene } from "./scene/AbbRobotScene.js";
import { AbbControlPanel } from "./ui/AbbControlPanel.js";
import { AbbMqttPanel } from "./ui/AbbMqttPanel.js";

function AbbRobotAppInner({ onBack }: SimulationAppProps)
{
  const meta = getSimulationMeta("abb-robot");
  const modelUrl = useMemo(
    () =>
      resolveSimulationModelUrl(
        meta?.modelPath ?? "models/abb-robot-arm/abb-robot-arm.glb",
      ),
    [meta?.modelPath],
  );

  return (
    <AbbMqttProvider>
      <SimulationAppShell
        title={meta?.title ?? "ABB Robot"}
        subtitle={meta?.subtitle}
        onBack={onBack}
        canvas={
          <SimulationCanvas>
            <AbbRobotScene modelUrl={modelUrl} />
          </SimulationCanvas>
        }
        leftPanel={
          <SimulationSidePanel title="Joint control" side="left">
            <AbbControlPanel />
          </SimulationSidePanel>
        }
        rightPanel={
          <SimulationSidePanel title="MQTT" side="right">
            <AbbMqttPanel />
          </SimulationSidePanel>
        }
      />
    </AbbMqttProvider>
  );
}

/**
 * ABB robot arm simulation entry.
 */
export function AbbRobotApp(props: SimulationAppProps)
{
  return (
    <AbbRobotProvider>
      <AbbRobotAppInner {...props} />
    </AbbRobotProvider>
  );
}
