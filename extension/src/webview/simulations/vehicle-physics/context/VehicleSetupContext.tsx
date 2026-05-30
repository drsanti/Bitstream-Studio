/*******************************************************************************
 * File Name : VehicleSetupContext.tsx
 *
 * Description : Exposes useVehicleSetup rebuild + vehicle refs to UI panels.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type * as THREE from "three";
import type { FourWheelVehicle } from "../vehicle/FourWheelVehicle.js";
import type { VehicleController } from "../vehicle/VehicleController.js";
import type { VehicleCamera } from "../vehicle/VehicleCamera.js";
import { useVehiclePhysics } from "./VehiclePhysicsContext.js";
import { useCameraTextureExtraction } from "../hooks/useCameraTextureExtraction.js";
import { useCanvasResize } from "../hooks/useCanvasResize.js";
import { useVehicleInput } from "../hooks/useVehicleInput.js";
import { useVehicleSetup } from "../hooks/useVehicleSetup.js";
import { useCameraSettingsStore } from "../store/camera-settings-store.js";

export type VehicleSetupContextValue = {
  rebuildVehicle: () => Promise<void>;
  vehicleRef: RefObject<FourWheelVehicle | null>;
  vehicleControllerRef: RefObject<VehicleController | null>;
  vehicleCameraRef: RefObject<VehicleCamera | null>;
  feedCanvasRef: RefObject<HTMLCanvasElement | null>;
  feedCanvasContainerRef: RefObject<HTMLDivElement | null>;
  feedCanvasSize: { width: number; height: number };
  targetFpsRef: RefObject<number>;
  physicsReady: boolean;
};

const VehicleSetupContext = createContext<VehicleSetupContextValue | null>(null);

export type VehicleSetupProviderProps = {
  model: THREE.Group | null;
  children: ReactNode;
};

/**
 * Runs vehicle setup hook and shares rebuild/refs with config panel.
 */
export function VehicleSetupProvider({ model, children }: VehicleSetupProviderProps)
{
  const { engine, loadState } = useVehiclePhysics();
  const extractTextureRef = useRef<(() => void) | null>(null);
  const cameraSettings = useCameraSettingsStore();
  const targetFpsRef = useRef(cameraSettings.targetFps);

  const physicsReady = loadState === "ready" && engine !== null;
  const unlockEngineSoundRef = useRef<(() => void) | null>(null);

  const { inputStateRef } = useVehicleInput(physicsReady, {
    onUserGesture: () => unlockEngineSoundRef.current?.(),
  });

  const { rebuildVehicle, vehicleCameraRef, vehicleRef, vehicleControllerRef } =
    useVehicleSetup({
      engine: physicsReady ? engine : null,
      model: physicsReady ? model ?? undefined : undefined,
      isInitialized: physicsReady && model !== null,
      inputStateRef,
      extractTextureRef,
      targetFpsRef,
      unlockEngineSoundRef,
    });

  const { canvasRef: feedCanvasRef, extractTexture } =
    useCameraTextureExtraction(vehicleCameraRef);
  const { canvasContainerRef: feedCanvasContainerRef, canvasSize: feedCanvasSize } =
    useCanvasResize();

  useEffect(() => {
    extractTextureRef.current = extractTexture;
  }, [extractTexture]);

  useEffect(() => {
    targetFpsRef.current = cameraSettings.targetFps;
  }, [cameraSettings.targetFps]);

  const value: VehicleSetupContextValue = {
    rebuildVehicle,
    vehicleRef,
    vehicleControllerRef,
    vehicleCameraRef,
    feedCanvasRef,
    feedCanvasContainerRef,
    feedCanvasSize,
    targetFpsRef,
    physicsReady,
  };

  return (
    <VehicleSetupContext.Provider value={value}>
      {children}
    </VehicleSetupContext.Provider>
  );
}

/** Vehicle setup API for config panel (inside VehicleSetupProvider). */
export function useVehicleSetupContext(): VehicleSetupContextValue
{
  const ctx = useContext(VehicleSetupContext);
  if (!ctx)
  {
    throw new Error(
      "useVehicleSetupContext must be used within VehicleSetupProvider",
    );
  }
  return ctx;
}
