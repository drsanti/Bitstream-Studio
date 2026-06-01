/*******************************************************************************
 * File Name : AbbRobotScene.tsx
 *
 * Description : ABB GLB scene with ArmController lifecycle.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { SimulationSceneEnvironment } from "../../shared/canvas/SimulationSceneEnvironment.js";
import { buildAbbArmLinks } from "../controller/buildAbbArmLinks.js";
import { ArmController } from "../controller/ArmController.js";
import { useAbbRobot } from "../context/AbbRobotContext.js";

export type AbbRobotSceneProps = {
  modelUrl: string;
};

/**
 * Loads GLB, builds Link1–Link6 controller, disposes on unmount.
 */
export function AbbRobotScene({ modelUrl }: AbbRobotSceneProps)
{
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { setController, setLinksReady } = useAbbRobot();

  useEffect(() =>
  {
    const links = buildAbbArmLinks(scene);
    if (links == null)
    {
      setLinksReady(false);
      setController(null);
      return;
    }

    const controller = new ArmController(links);
    setLinksReady(true);
    setController(controller);

    return () =>
    {
      void controller.dispose();
      setController(null);
      setLinksReady(false);
    };
  }, [scene, setController, setLinksReady]);

  return (
    <>
      <SimulationSceneEnvironment />
      <primitive object={scene} />
    </>
  );
}
