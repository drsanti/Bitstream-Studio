"use no memo";

import { getSimulationMeta } from "../catalog/simulationCatalog.js";
import type { SimulationAppProps } from "../catalog/types.js";
import {
  SimulationCanvas,
  SimulationSidePanel,
} from "../shared/index.js";
import { PhysicsLabScene } from "./scene/PhysicsLabScene.js";
import { PhysicsLabInspector } from "./ui/PhysicsLabInspector.js";
import { PhysicsLabOutliner } from "./ui/PhysicsLabOutliner.js";
import { PhysicsLabToolbar } from "./ui/PhysicsLabToolbar.js";

export function PhysicsLabApp({ onBack }: SimulationAppProps) {
  const meta = getSimulationMeta("physics-lab");

  return (
    <div className="fixed inset-0 z-400 flex min-h-0 flex-col bg-zinc-950">
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <SimulationCanvas>
            <PhysicsLabScene />
          </SimulationCanvas>
        </div>
        <PhysicsLabToolbar
          title={meta?.title ?? "Physics Lab"}
          subtitle={meta?.subtitle}
          onBack={onBack}
        />
        <SimulationSidePanel title="Outliner" side="left">
          <PhysicsLabOutliner />
        </SimulationSidePanel>
        <SimulationSidePanel title="Inspector" side="right">
          <PhysicsLabInspector />
        </SimulationSidePanel>
      </div>
    </div>
  );
}
