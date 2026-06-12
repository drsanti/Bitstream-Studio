"use no memo";

import { Physics } from "@react-three/rapier";
import type { PhysicsLabBoxSelectProjector } from "../core/physicsLabBoxSelectProjector.js";
import {
  physicsLabPhysicsPaused,
  usePhysicsLabStore,
} from "../store/physicsLabStore.js";
import { PhysicsLabBody } from "./PhysicsLabBody.js";
import { PhysicsLabBoxSelectBridge } from "./PhysicsLabBoxSelectBridge.js";
import { PhysicsLabSceneEnvironment } from "./PhysicsLabSceneEnvironment.js";
import { PhysicsLabTransformGizmo } from "./PhysicsLabTransformGizmo.js";

const GRAVITY: [number, number, number] = [0, -9.81, 0];

type PhysicsLabSceneProps = {
  onRegisterBoxSelectProjector: (projector: PhysicsLabBoxSelectProjector | null) => void;
  onObjectPointerDown: () => void;
};

export function PhysicsLabScene({
  onRegisterBoxSelectProjector,
  onObjectPointerDown,
}: PhysicsLabSceneProps) {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const simGeneration = usePhysicsLabStore((s) => s.simGeneration);
  const bodies = usePhysicsLabStore((s) => s.bodies);
  const paused = physicsLabPhysicsPaused({ workbenchMode, isPlaying });

  return (
    <>
      <PhysicsLabSceneEnvironment />
      <PhysicsLabBoxSelectBridge onRegister={onRegisterBoxSelectProjector} />
      <Physics
        key={simGeneration}
        gravity={GRAVITY}
        paused={paused}
        timeStep={1 / 60}
      >
        {bodies.map((body) => (
          <PhysicsLabBody
            key={body.id}
            body={body}
            onObjectPointerDown={onObjectPointerDown}
          />
        ))}
      </Physics>
      <PhysicsLabTransformGizmo onObjectPointerDown={onObjectPointerDown} />
    </>
  );
}
