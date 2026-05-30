/*******************************************************************************
 * File Name : VehiclePhysicsApp.tsx
 *
 * Description : Vehicle physics simulation (Jolt four-wheel, T3D app03 parity).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";
import { getSimulationMeta } from "../catalog/simulationCatalog.js";
import type { SimulationAppProps } from "../catalog/types.js";
import {
  SimulationAppShell,
  SimulationCanvas,
  SimulationSidePanel,
  resolveSimulationModelUrl,
} from "../shared/index.js";
import { VehiclePhysicsProvider } from "./context/VehiclePhysicsContext.js";
import { VehicleSetupProvider } from "./context/VehicleSetupContext.js";
import { VehiclePhysicsLoop } from "./scene/VehiclePhysicsLoop.js";
import { VehiclePhysicsModel } from "./scene/VehiclePhysicsModel.js";
import { VehicleConfigPanel } from "./ui/VehicleConfigPanel.js";
import { VehicleSessionPanel } from "./ui/VehicleSessionPanel.js";

/**
 * Vehicle physics simulation entry (Jolt single-thread, ported from T3D app03-cube-bot).
 */
export function VehiclePhysicsApp({ onBack }: SimulationAppProps)
{
  const meta = getSimulationMeta("vehicle-physics");
  const modelUrl = useMemo(
    () =>
      resolveSimulationModelUrl(
        meta?.modelPath ?? "models/car-cam-physics/car-cam-physics.glb",
      ),
    [meta?.modelPath],
  );
  const [modelRoot, setModelRoot] = useState<THREE.Group | null>(null);

  const onModelReady = useCallback((root: THREE.Group) => {
    setModelRoot(root);
  }, []);

  return (
    <VehiclePhysicsProvider>
      <VehicleSetupProvider model={modelRoot}>
        <SimulationAppShell
          title={meta?.title ?? "Vehicle Physics"}
          subtitle={meta?.subtitle}
          onBack={onBack}
          canvas={
            <SimulationCanvas>
              <VehiclePhysicsLoop />
              <VehiclePhysicsModel
                modelUrl={modelUrl}
                onModelReady={onModelReady}
              />
            </SimulationCanvas>
          }
          leftPanel={
            <SimulationSidePanel title="Session & camera" side="left">
              <VehicleSessionPanel />
            </SimulationSidePanel>
          }
          rightPanel={
            <SimulationSidePanel title="Vehicle config" side="right">
              <VehicleConfigPanel />
            </SimulationSidePanel>
          }
        />
      </VehicleSetupProvider>
    </VehiclePhysicsProvider>
  );
}
