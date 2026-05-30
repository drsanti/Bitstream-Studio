/*******************************************************************************
 * File Name : useVehicleInput.ts
 *
 * Description : Keyboard input for vehicle driving (WASD / arrows / brake).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import type { VehicleInputState } from "../vehicle/VehicleController.js";

export type UseVehicleInputReturn = {
  inputStateRef: React.MutableRefObject<VehicleInputState>;
  cleanup: () => void;
};

export type UseVehicleInputOptions = {
  /** Called synchronously on key/pointer down (Web Audio unlock). */
  onUserGesture?: () => void;
};

/**
 * Window keyboard handlers for vehicle control (no T3D engine keyboard).
 */
export function useVehicleInput(
  enabled: boolean,
  options?: UseVehicleInputOptions,
): UseVehicleInputReturn
{
  const onUserGesture = options?.onUserGesture;
  const inputStateRef = useRef<VehicleInputState>({
    forwardPressed: false,
    backwardPressed: false,
    leftPressed: false,
    rightPressed: false,
    handBrake: false,
  });

  useEffect(() => {
    if (!enabled)
    {
      return;
    }

    const setKey = (key: string, down: boolean): void =>
    {
      const k = key.toLowerCase();
      if (k === "w" || k === "arrowup")
      {
        inputStateRef.current.forwardPressed = down;
      }
      else if (k === "s" || k === "arrowdown")
      {
        inputStateRef.current.backwardPressed = down;
      }
      else if (k === "a" || k === "arrowleft")
      {
        inputStateRef.current.leftPressed = down;
      }
      else if (k === "d" || k === "arrowright")
      {
        inputStateRef.current.rightPressed = down;
      }
      else if (k === "z" || k === " ")
      {
        inputStateRef.current.handBrake = down;
      }
    };

    const onKeyDown = (ev: KeyboardEvent): void =>
    {
      onUserGesture?.();
      setKey(ev.key, true);
    };

    const onPointerDown = (): void =>
    {
      onUserGesture?.();
    };

    const onKeyUp = (ev: KeyboardEvent): void =>
    {
      setKey(ev.key, false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      inputStateRef.current = {
        forwardPressed: false,
        backwardPressed: false,
        leftPressed: false,
        rightPressed: false,
        handBrake: false,
      };
    };
  }, [enabled, onUserGesture]);

  const cleanup = (): void =>
  {
    inputStateRef.current = {
      forwardPressed: false,
      backwardPressed: false,
      leftPressed: false,
      rightPressed: false,
      handBrake: false,
    };
  };

  return { inputStateRef, cleanup };
}
