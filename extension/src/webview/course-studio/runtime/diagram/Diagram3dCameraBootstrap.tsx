import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

const ORIGIN = new THREE.Vector3(0, 0, 0);

/** Aim the active camera at the scene origin whenever the document default position changes. */
export function Diagram3dCameraBootstrap({
  position,
  fov = 45,
}: {
  position: [number, number, number];
  fov?: number;
}) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
    }
    camera.lookAt(ORIGIN);
    camera.updateProjectionMatrix();
  }, [camera, fov, position[0], position[1], position[2]]);

  return null;
}
