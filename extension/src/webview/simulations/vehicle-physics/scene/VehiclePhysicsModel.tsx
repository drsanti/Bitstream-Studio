/*******************************************************************************
 * File Name : VehiclePhysicsModel.tsx
 *
 * Description : Load car-cam-physics GLB and expose root group for vehicle setup.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SimulationSceneEnvironment } from "../../shared/canvas/SimulationSceneEnvironment.js";

export type VehiclePhysicsModelProps = {
  modelUrl: string;
  onModelReady: (root: THREE.Group) => void;
};

/**
 * Clones GLB at authored transforms (T3D parity) and notifies parent.
 */
export function VehiclePhysicsModel({
  modelUrl,
  onModelReady,
}: VehiclePhysicsModelProps)
{
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true) as THREE.Group, [gltf.scene]);

  useEffect(() => {
    onModelReady(scene);
  }, [scene, onModelReady]);

  return (
    <>
      <SimulationSceneEnvironment />
      <primitive object={scene} />
    </>
  );
}
