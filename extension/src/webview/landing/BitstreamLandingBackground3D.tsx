/*******************************************************************************
 * File Name : BitstreamLandingBackground3D.tsx
 *
 * Description : Full-bleed R3F canvas for the welcome cube-floor backdrop.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

"use no memo";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { WelcomeBackground3DScene } from "./WelcomeBackground3DScene.js";
import { WebGLSurfaceLifecycle } from "../shared/webgl/WebGLSurfaceLifecycle.js";
import {
  WELCOME_BG3D_CAMERA_FROM,
  WELCOME_BG3D_SCENE_BACKGROUND,
} from "./welcomeBackground3DConstants.js";

export type BitstreamLandingBackground3DProps = {
  className?: string;
  /** When false, scene is static (prefers-reduced-motion). */
  animate?: boolean;
  /** Clear alpha 0 so the 2D backdrop shows through (blend / overlay presets). */
  transparentCanvas?: boolean;
};

/**
 * WebGL layer for BitstreamLanding — eager import keeps R3F on the same React bundle
 * as the shell (lazy chunks caused invalid hook #321 when reopening landing via Ctrl+/).
 */
export function BitstreamLandingBackground3D({
  className,
  animate = true,
  transparentCanvas = false,
}: BitstreamLandingBackground3DProps)
{
  const camera = useMemo(
    () => ({
      position: [...WELCOME_BG3D_CAMERA_FROM] as [number, number, number],
      fov: 45,
      near: 0.1,
      far: 200,
    }),
    [],
  );

  return (
    <div
      className={className ?? "webview-launcher-bg-3d pointer-events-none absolute inset-0 z-1"}
      aria-hidden
    >
      <Canvas
        key="bitstream-landing-bg3d"
        className="pointer-events-none h-full w-full"
        gl={{
          antialias: true,
          alpha: transparentCanvas,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.25]}
        camera={camera}
        onCreated={({ gl }) =>
        {
          gl.setClearColor(
            WELCOME_BG3D_SCENE_BACKGROUND,
            transparentCanvas ? 0 : 1,
          );
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <WebGLSurfaceLifecycle />
        <Suspense fallback={null}>
          <WelcomeBackground3DScene
            animate={animate}
            transparentBackground={transparentCanvas}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
