/*******************************************************************************
 * File Name : LandingCss3dCameraSync.tsx
 *
 * Description : Publishes R3F camera matrices to the CSS3D overlay each frame.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { useLandingCss3dCameraStore } from "./landingCss3dCamera.store.js";

/**
 * Mount inside {@link BitstreamLandingBackground3D} Canvas only.
 */
export function LandingCss3dCameraSync()
{
  const setSnapshot = useLandingCss3dCameraStore((s) => s.setSnapshot);
  const clearSnapshot = useLandingCss3dCameraStore((s) => s.clearSnapshot);

  useFrame(({ camera, size }) =>
  {
    setSnapshot(camera, size.width, size.height);
  });

  useEffect(() =>
  {
    return () =>
    {
      clearSnapshot();
    };
  }, [clearSnapshot]);

  return null;
}
