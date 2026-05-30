/*******************************************************************************
 * File Name : SimulationModelScene.tsx
 *
 * Description : Generic GLB preview scene for simulation stubs.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Center, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { SimulationSceneEnvironment } from "../canvas/SimulationSceneEnvironment.js";

export type SimulationModelSceneProps = {
  modelUrl: string;
};

/**
 * Displays a loaded GLB with default simulation lighting and orbit controls.
 */
export function SimulationModelScene({ modelUrl }: SimulationModelSceneProps)
{
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <>
      <SimulationSceneEnvironment />
      <Center>
        <primitive object={scene} />
      </Center>
    </>
  );
}
