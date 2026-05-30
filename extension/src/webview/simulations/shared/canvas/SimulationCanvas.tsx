/*******************************************************************************
 * File Name : SimulationCanvas.tsx
 *
 * Description : Shared R3F Canvas wrapper for Digital Twin simulations.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

"use no memo";

import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import * as THREE from "three";
import {
  SIMULATION_CAMERA_FOV,
  SIMULATION_CAMERA_POSITION,
  SIMULATION_TONE_MAPPING_EXPOSURE,
} from "./simulationCanvasConstants.js";
import { WebGLSurfaceLifecycle } from "../../../shared/webgl/WebGLSurfaceLifecycle.js";

export type SimulationCanvasProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Full-size WebGL canvas with shared camera and tone mapping defaults.
 */
export function SimulationCanvas({ className, children }: SimulationCanvasProps)
{
  return (
    <Canvas
      className={className ?? "h-full w-full"}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
      camera={{
        position: [...SIMULATION_CAMERA_POSITION],
        fov: SIMULATION_CAMERA_FOV,
      }}
      onCreated={({ gl }) =>
      {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = SIMULATION_TONE_MAPPING_EXPOSURE;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <WebGLSurfaceLifecycle />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
