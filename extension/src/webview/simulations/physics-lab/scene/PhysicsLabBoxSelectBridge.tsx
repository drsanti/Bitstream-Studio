"use no memo";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PhysicsLabBoxSelectProjector } from "../core/physicsLabBoxSelectProjector.js";
import { listPhysicsLabBodyIdsInViewportRect } from "../core/physicsLabBoxSelectProjector.js";

type PhysicsLabBoxSelectBridgeProps = {
  onRegister: (projector: PhysicsLabBoxSelectProjector | null) => void;
};

export function PhysicsLabBoxSelectBridge({ onRegister }: PhysicsLabBoxSelectBridgeProps) {
  const { camera, size } = useThree();

  useEffect(() => {
    const projector: PhysicsLabBoxSelectProjector = (rect) =>
      listPhysicsLabBodyIdsInViewportRect(rect, camera, size.width, size.height);
    onRegister(projector);
    return () => {
      onRegister(null);
    };
  }, [camera, onRegister, size.height, size.width]);

  return null;
}
