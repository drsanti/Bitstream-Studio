/*******************************************************************************
 * File Name : VehiclePhysicsLoop.tsx
 *
 * Description : R3F useFrame step for Jolt + vehicle callbacks.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useVehiclePhysics } from "../context/VehiclePhysicsContext.js";

/**
 * Registers scene/renderer and steps physics each frame when running.
 */
export function VehiclePhysicsLoop()
{
  const { engine, isRunning, registerSceneRenderer } = useVehiclePhysics();
  const { scene, gl } = useThree();

  useEffect(() => {
    registerSceneRenderer(scene, gl);
  }, [scene, gl, registerSceneRenderer]);

  useFrame((_state, delta) => {
    if (!engine || !isRunning)
    {
      return;
    }
    engine.update(delta);
  });

  return null;
}
