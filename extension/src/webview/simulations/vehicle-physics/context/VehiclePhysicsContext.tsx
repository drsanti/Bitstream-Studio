/*******************************************************************************
 * File Name : VehiclePhysicsContext.tsx
 *
 * Description : Jolt load state and VehicleSimulationEngine for vehicle sim.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type * as THREE from "three";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { T3DPhysics } from "@vehicle-jolt/T3DPhysics.js";
import { createVehiclePhysicsHost } from "../physics/VehiclePhysicsHost.js";
import { VehicleSimulationEngine } from "../physics/VehicleSimulationEngine.js";
import { loadVehicleJolt } from "../physics/loadVehicleJolt.js";

export type VehiclePhysicsLoadState =
  | "idle"
  | "loading"
  | "ready"
  | "error";

type SceneRendererBind = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
};

export type VehiclePhysicsContextValue = {
  loadState: VehiclePhysicsLoadState;
  loadError: string | null;
  engine: VehicleSimulationEngine | null;
  startPhysics: () => Promise<void>;
  setRunning: (running: boolean) => void;
  isRunning: boolean;
  registerSceneRenderer: (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => void;
};

const VehiclePhysicsContext = createContext<VehiclePhysicsContextValue | null>(
  null,
);

export type VehiclePhysicsProviderProps = {
  children: ReactNode;
};

/**
 * Lazy-loads Jolt and exposes VehicleSimulationEngine once scene/renderer are registered.
 */
export function VehiclePhysicsProvider({ children }: VehiclePhysicsProviderProps)
{
  const [loadState, setLoadState] = useState<VehiclePhysicsLoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [engine, setEngine] = useState<VehicleSimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const bindRef = useRef<SceneRendererBind | null>(null);
  const engineRef = useRef<VehicleSimulationEngine | null>(null);

  const registerSceneRenderer = useCallback(
    (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
      bindRef.current = { scene, renderer };
    },
    [],
  );

  const startPhysics = useCallback(async () => {
    if (loadState === "loading")
    {
      return;
    }

    if (loadState === "ready" && engineRef.current)
    {
      engineRef.current.setRunning(true);
      setIsRunning(true);
      return;
    }

    if (!bindRef.current)
    {
      setLoadError("Scene not ready");
      setLoadState("error");
      return;
    }

    setLoadState("loading");
    setLoadError(null);

    try
    {
      const Jolt = await loadVehicleJolt();
      const { scene, renderer } = bindRef.current;
      const { host, bindFrameHost } = createVehiclePhysicsHost(scene);
      const physics = new T3DPhysics(host, Jolt);
      await physics.init();

      const simEngine = new VehicleSimulationEngine(physics, scene, renderer);
      bindFrameHost(simEngine);
      physics.start();

      engineRef.current = simEngine;
      setEngine(simEngine);
      setLoadState("ready");
      simEngine.setRunning(true);
      setIsRunning(true);
    }
    catch (err)
    {
      const message = err instanceof Error ? err.message : String(err);
      setLoadError(message);
      setLoadState("error");
    }
  }, [loadState]);

  const setRunning = useCallback((running: boolean) => {
    engineRef.current?.setRunning(running);
    setIsRunning(running);
  }, []);

  const value = useMemo(
    (): VehiclePhysicsContextValue => ({
      loadState,
      loadError,
      engine,
      startPhysics,
      setRunning,
      isRunning,
      registerSceneRenderer,
    }),
    [
      loadState,
      loadError,
      engine,
      startPhysics,
      setRunning,
      isRunning,
      registerSceneRenderer,
    ],
  );

  return (
    <VehiclePhysicsContext.Provider value={value}>
      {children}
    </VehiclePhysicsContext.Provider>
  );
}

/** Read vehicle physics context (must be inside provider). */
export function useVehiclePhysics(): VehiclePhysicsContextValue
{
  const ctx = useContext(VehiclePhysicsContext);
  if (!ctx)
  {
    throw new Error("useVehiclePhysics must be used within VehiclePhysicsProvider");
  }
  return ctx;
}
