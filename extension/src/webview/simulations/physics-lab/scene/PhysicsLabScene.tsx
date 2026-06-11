"use no memo";

import { Physics } from "@react-three/rapier";
import { SimulationSceneEnvironment } from "../../shared/canvas/SimulationSceneEnvironment.js";
import {
  physicsLabPhysicsPaused,
  usePhysicsLabStore,
} from "../store/physicsLabStore.js";
import { PhysicsLabDynamicBox } from "./PhysicsLabDynamicBox.js";
import { PhysicsLabFloor } from "./PhysicsLabFloor.js";

const GRAVITY: [number, number, number] = [0, -9.81, 0];

export function PhysicsLabScene() {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const simGeneration = usePhysicsLabStore((s) => s.simGeneration);
  const paused = physicsLabPhysicsPaused({ workbenchMode, isPlaying });

  return (
    <>
      <SimulationSceneEnvironment />
      <Physics
        key={simGeneration}
        gravity={GRAVITY}
        paused={paused}
        timeStep={1 / 60}
      >
        <PhysicsLabFloor />
        <PhysicsLabDynamicBox />
      </Physics>
    </>
  );
}
