/*******************************************************************************
 * File Name : VehiclePhysicsHost.ts
 *
 * Description : Minimal scene host for ported T3DPhysics (R3F integration).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type * as THREE from "three";

/**
 * Subset of VehicleSimulationEngine engine surface required by T3DPhysics body manager.
 */
export interface VehiclePhysicsHost
{
  getScene(): THREE.Scene;
  /** Optional — used by T3DPhysicsObjectBuilder sync (VehicleSimulationEngine). */
  onFrame?(callback: () => void): () => void;
}

type FrameHostState = {
  onFrameImpl: VehiclePhysicsHost["onFrame"] | null;
};

/**
 * Host for T3DPhysics before VehicleSimulationEngine exists; bind onFrame after engine create.
 */
export function createVehiclePhysicsHost(scene: THREE.Scene): {
  host: VehiclePhysicsHost;
  bindFrameHost: (target: VehiclePhysicsHost) => void;
}
{
  const state: FrameHostState = { onFrameImpl: null };

  const host: VehiclePhysicsHost = {
    getScene: () => scene,
    onFrame: (callback) => {
      if (state.onFrameImpl)
      {
        return state.onFrameImpl(callback);
      }
      return () => {};
    },
  };

  return {
    host,
    bindFrameHost: (target) => {
      state.onFrameImpl = target.onFrame ?? null;
    },
  };
}
