/*******************************************************************************
 * File Name : webglSurfaceTransition.ts
 *
 * Description : Tracks WebGL surface mount/teardown so the next Canvas can defer
 *               until the prior R3F/Three renderer finishes DOM cleanup.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useState } from "react";

/** Epoch ms when the most recent WebGL surface finished unmount cleanup. */
let lastWebglTeardownAt = 0;

/** Minimum quiet period before mounting the next Canvas (landing ↔ sim). */
const WEBGL_MOUNT_QUIET_MS = 80;

/**
 * Called from {@link WebGLSurfaceLifecycle} when an R3F Canvas mounts.
 */
export function registerWebGLSurfaceMount(): void
{
  /* Reserved for diagnostics; mount timing is driven by teardown gaps. */
}

/**
 * Called from {@link WebGLSurfaceLifecycle} when an R3F Canvas unmounts.
 */
export function registerWebGLSurfaceUnmount(): void
{
  lastWebglTeardownAt = performance.now();
}

/**
 * Milliseconds since the last WebGL surface teardown (0 if never torn down).
 */
export function msSinceWebglTeardown(): number
{
  if (lastWebglTeardownAt <= 0)
  {
    return Number.POSITIVE_INFINITY;
  }
  return performance.now() - lastWebglTeardownAt;
}

/**
 * When true, wait until any recent WebGL teardown settles before mounting UI that
 * creates a new R3F Canvas (prevents React removeChild races + context lost).
 */
export function useWebGLSurfaceReady(wantMount: boolean): boolean
{
  const [ready, setReady] = useState(wantMount);

  useEffect(() =>
  {
    if (!wantMount)
    {
      setReady(false);
      return undefined;
    }

    const quietFor = msSinceWebglTeardown();
    if (quietFor >= WEBGL_MOUNT_QUIET_MS)
    {
      setReady(true);
      return undefined;
    }

    let alive = true;
    setReady(false);
    const waitMs = WEBGL_MOUNT_QUIET_MS - quietFor;

    const timeoutId = window.setTimeout(() =>
    {
      requestAnimationFrame(() =>
      {
        requestAnimationFrame(() =>
        {
          if (alive)
          {
            setReady(true);
          }
        });
      });
    }, waitMs);

    return () =>
    {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, [wantMount]);

  return wantMount && ready;
}
