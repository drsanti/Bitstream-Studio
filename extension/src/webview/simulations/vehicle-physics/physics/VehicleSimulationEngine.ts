/*******************************************************************************
 * File Name : VehicleSimulationEngine.ts
 *
 * Description : R3F-facing shim replacing VehicleSimulationEngine engine for app03-cube-bot hooks.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type * as THREE from "three";
import type { T3DPhysics } from "@vehicle-jolt/T3DPhysics.js";
import type { VehiclePhysicsHost } from "./VehiclePhysicsHost.js";

export type VehicleGraphicsShim = {
  getScene(): THREE.Scene;
  getRenderer(): THREE.WebGLRenderer;
};

/**
 * Thin engine adapter: physics + scene + renderer + per-frame callbacks for vehicle sim.
 */
export class VehicleSimulationEngine implements VehiclePhysicsHost
{
  private readonly frameCallbacks = new Set<() => void>();
  private running = false;

  constructor(
    private readonly physics: T3DPhysics,
    private readonly scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
  )
  {
  }

  /** @inheritdoc */
  getScene(): THREE.Scene
  {
    return this.scene;
  }

  /** Ported hooks expect engine.getPhysics(). */
  getPhysics(): T3DPhysics
  {
    return this.physics;
  }

  /** Graphics shim for VehicleCamera setup. */
  getGraphics(): VehicleGraphicsShim
  {
    return {
      getScene: () => this.scene,
      getRenderer: () => this.renderer,
    };
  }

  /**
   * Register a callback invoked each frame after physics step (VehicleSimulationEngine onFrame parity).
   */
  onFrame(callback: () => void): () => void
  {
    this.frameCallbacks.add(callback);
    return () => {
      this.frameCallbacks.delete(callback);
    };
  }

  /** Run registered frame callbacks (call from R3F useFrame). */
  runFrameCallbacks(): void
  {
    if (!this.running)
    {
      return;
    }
    for (const cb of this.frameCallbacks)
    {
      cb();
    }
  }

  /** Step Jolt and run vehicle/controller callbacks. */
  update(deltaSeconds: number): void
  {
    if (!this.running)
    {
      return;
    }
    this.physics.update(deltaSeconds);
    this.runFrameCallbacks();
  }

  setRunning(running: boolean): void
  {
    this.running = running;
    if (running)
    {
      this.physics.start();
    }
    else
    {
      this.physics.stop();
    }
  }

  isRunning(): boolean
  {
    return this.running;
  }

  dispose(): void
  {
    this.frameCallbacks.clear();
    this.running = false;
    this.physics.dispose();
  }
}
