/*******************************************************************************
 * File Name : useRotationDegHistory.ts
 *
 * Description : Rolling buffers for rotation X/Y/Z degree plot series.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";

export type RotationDegSample = {
  x: number;
  y: number;
  z: number;
};

export type RotationDegHistory = {
  x: number[];
  y: number[];
  z: number[];
};

export type RotationDegHistoryResult = RotationDegHistory & {
  /** Bumps when buffers are cleared. */
  version: number;
};

export type RotationDegSampleSource =
  | RotationDegSample
  | null
  | (() => RotationDegSample | null);

function pushSample(arr: number[], value: number, maxLength: number): void
{
  arr.push(value);
  if (arr.length > maxLength)
  {
    arr.shift();
  }
}

function resolveSample(source: RotationDegSampleSource): RotationDegSample | null
{
  if (typeof source === "function")
  {
    return source();
  }
  return source;
}

/**
 * Appends samples on requestAnimationFrame while enabled.
 * Prefer a getter (e.g. `() => store.getState().liveRotationDeg`) so samples
 * stay in sync with R3F useFrame updates without waiting on React renders.
 */
export function useRotationDegHistory(
  sampleSource: RotationDegSampleSource,
  enabled: boolean,
  maxLength = 512,
): RotationDegHistoryResult
{
  const sourceRef = useRef(sampleSource);
  sourceRef.current = sampleSource;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const maxLengthRef = useRef(maxLength);
  maxLengthRef.current = maxLength;

  const xRef = useRef<number[]>([]);
  const yRef = useRef<number[]>([]);
  const zRef = useRef<number[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() =>
  {
    if (!enabled)
    {
      return;
    }

    let rafId = 0;

    const tick = (): void =>
    {
      if (!enabledRef.current)
      {
        return;
      }

      const s = resolveSample(sourceRef.current);
      if (s != null)
      {
        const cap = maxLengthRef.current;
        pushSample(xRef.current, s.x, cap);
        pushSample(yRef.current, s.y, cap);
        pushSample(zRef.current, s.z, cap);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () =>
    {
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  useEffect(() =>
  {
    if (enabled)
    {
      return;
    }
    xRef.current.length = 0;
    yRef.current.length = 0;
    zRef.current.length = 0;
    setVersion((v) => v + 1);
  }, [enabled]);

  return {
    x: xRef.current,
    y: yRef.current,
    z: zRef.current,
    version,
  };
}

/**
 * Clears history buffers (call when target or mode changes).
 */
export function clearRotationDegHistoryRefs(
  history: { x: number[]; y: number[]; z: number[] },
): void
{
  history.x.length = 0;
  history.y.length = 0;
  history.z.length = 0;
}
