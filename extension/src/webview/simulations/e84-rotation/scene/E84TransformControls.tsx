/*******************************************************************************
 * File Name : E84TransformControls.tsx
 *
 * Description : drei TransformControls on E84 target when in manual UI mode.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Object3D } from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import { useE84MovementStore } from "../store/e84Movement.store.js";

export type E84TransformControlsProps = {
  target: Object3D | null;
};

/**
 * Attaches transform gizmo to E84_1; disables orbit while dragging.
 */
export function E84TransformControls({ target }: E84TransformControlsProps)
{
  const uiMode = useE84MovementStore((s) => s.uiMode);
  const transformMode = useE84MovementStore((s) => s.transformMode);
  const transformSpace = useE84MovementStore((s) => s.transformSpace);
  const controlsRef = useRef<TransformControlsImpl | null>(null);
  const orbit = useThree((s) => s.controls);

  useEffect(() =>
  {
    const tc = controlsRef.current;
    if (tc == null || orbit == null || uiMode !== "manual")
    {
      return;
    }

    const onDraggingChanged = (event: { value: boolean }): void =>
    {
      if ("enabled" in orbit)
      {
        (orbit as { enabled: boolean }).enabled = !event.value;
      }
    };

    tc.addEventListener("dragging-changed", onDraggingChanged);
    return () =>
    {
      tc.removeEventListener("dragging-changed", onDraggingChanged);
      if ("enabled" in orbit)
      {
        (orbit as { enabled: boolean }).enabled = true;
      }
    };
  }, [orbit, uiMode]);

  if (uiMode !== "manual" || target == null)
  {
    return null;
  }

  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode={transformMode}
      space={transformSpace}
    />
  );
}
