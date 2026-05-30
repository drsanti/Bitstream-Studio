/*******************************************************************************
 * File Name : WebGLSurfaceLifecycle.tsx
 *
 * Description : Mount inside R3F Canvas — registers WebGL surface lifecycle for
 *               cross-route transitions (landing backdrop ↔ simulation viewport).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

"use no memo";

import { useEffect } from "react";
import {
  registerWebGLSurfaceMount,
  registerWebGLSurfaceUnmount,
} from "./webglSurfaceTransition.js";

/**
 * Publishes mount/unmount timing; R3F owns renderer disposal on Canvas unmount.
 */
export function WebGLSurfaceLifecycle()
{
  useEffect(() =>
  {
    registerWebGLSurfaceMount();

    return () =>
    {
      registerWebGLSurfaceUnmount();
    };
  }, []);

  return null;
}
