import { VehiclePhysicsHost } from '@vehicle-host';
import * as THREE from 'three';
import type {
  JoltModule,
  PhysicsSystem,
  BodyInterface,
  JoltInterface,
  Vec3,
  RVec3,
  Quat,
  Body,
  Shape,
} from './jolt-loader';
import { T3DJoltLoader } from './jolt-loader';

// Import types and classes for internal use

import type { T3DDynamicObject } from './core/T3DPhysicsBodyManager';

// Export types and constants from core modules
export type { JoltModule };
export {
  LAYER_NON_MOVING,
  LAYER_MOVING,
  NUM_OBJECT_LAYERS,
} from './core/T3DPhysicsConfig';

export type { T3DDynamicObject } from './core/T3DPhysicsBodyManager';

// Import core modules
import { setupCollisionFiltering } from './core/T3DPhysicsInitializer';
import {
  registerPhysicsBody,
  removeFromScene,
  clearAllBodies,
  disposeVisualGroup,
  type BodyManagerState,
} from './core/T3DPhysicsBodyManager';
import {
  updatePhysics,
  startPhysics,
  stopPhysics,
  isPaused,
  type UpdateState,
} from './core/T3DPhysicsUpdate';
import {
  createDebugMesh,
  getDebugMeshMaterial,
} from './core/T3DPhysicsDebugMesh';
import {
  createMeshForShape,
  getSoftBodyMesh,
} from './core/T3DPhysicsShapeMesh';
import {
  createFloor,
  createBox,
  createSphere,
  createMeshFloor,
  addRandomObjectToScene,
  type BodyFactoryState,
} from './core/T3DPhysicsBodyFactory';
import { T3DPhysicsUtils } from './core/T3DPhysicsUtils';

export class T3DPhysics {
  private engine: VehiclePhysicsHost;
  private maxWorkerThreads: number;

  private Jolt!: JoltModule;
  private physicsSystem!: PhysicsSystem;
  private bodyInterface!: BodyInterface;
  private joltInterface!: JoltInterface;

  private dynamicObjects: T3DDynamicObject[] = [];
  private spawnInterval?: NodeJS.Timeout;
  private frameCount: number = 0;
  private accumulatedTime: number = 0;
  private initialized: boolean = false;
  private initPromise?: Promise<void>;
  private disposed: boolean = false;
  private paused: boolean = false;

  // Add material cache at class level - key is shape type (EShapeSubType)
  private materialCache: Map<
    number,
    THREE.MeshNormalMaterial | THREE.MeshStandardMaterial
  > = new Map();

  // Track special objects that should not be automatically removed
  private protectedObjects: Set<T3DDynamicObject> = new Set();

  /**
   * Constructor for T3DPhysics
   * @param engine - VehiclePhysicsHost engine instance
   * @param Jolt - Jolt Physics module (must be loaded before creating T3DPhysics)
   */
  constructor(engine: VehiclePhysicsHost, Jolt: JoltModule) {
    this.engine = engine;
    this.Jolt = Jolt;
    // Get worker thread count from T3DJoltLoader (defaults to 5 if not available)
    this.maxWorkerThreads = T3DJoltLoader.getWorkerThreadCount() ?? 5;
    this.init();
  }

  /**
   * Initializes the physics system
   */
  public async init(): Promise<void> {
    // Reset disposed flag when reinitializing (for hot reload scenarios)
    this.disposed = false;

    // If already initialized, return immediately
    // The initialized flag is only set after all systems are ready
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initPromise !== undefined) {
      return this.initPromise;
    }

    // Start initialization and store the promise
    this.initPromise = this.initializePhysicsSystem();
    try {
      await this.initPromise;
    } finally {
      // Clear the promise after completion (success or failure)
      this.initPromise = undefined;
    }
  }

  /**
   * Initialize the physics system: configure settings (worker threads, collision filtering, solver, gravity).
   */
  private async initializePhysicsSystem(): Promise<void> {
    // Step 1: Start timing the physics system initialization
    const systemInitStart = performance.now();
    console.log(
      `⏳ Initializing physics system with ${this.maxWorkerThreads} worker thread(s)...`
    );

    // Jolt module is available as this.Jolt

    // Step 2: Create a new Jolt settings object
    const settings = new this.Jolt.JoltSettings();
    settings.mMaxWorkerThreads = this.maxWorkerThreads;

    // Step 3: Setup collision filtering
    setupCollisionFiltering(this.Jolt, settings);

    // Step 4: Create Jolt interface and get physics system
    this.joltInterface = new this.Jolt.JoltInterface(settings);

    // Step 4.1: Destroy settings (no longer needed after creating interface)
    this.Jolt.destroy(settings);

    // Step 4.2: Get the physics system and body interface
    this.physicsSystem = this.joltInterface.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();

    // Step 5: Configure solver iterations (velocity=6, position=2 for safe defaults)
    const physicsSettings = this.physicsSystem.GetPhysicsSettings();
    physicsSettings.mNumVelocitySteps = 6; // Default solver iterations
    physicsSettings.mNumPositionSteps = 2; // Default position correction
    this.physicsSystem.SetPhysicsSettings(physicsSettings);

    // Step 6: Set the gravity
    const gravity = new this.Jolt.Vec3(0, -9.81 * 1, 0);
    this.physicsSystem.SetGravity(gravity);
    this.Jolt.destroy(gravity); // Vec3 is copied by SetGravity, safe to destroy

    // Step 7: Calculate and log initialization times
    const systemInitTime = (
      (performance.now() - systemInitStart) /
      1000
    ).toFixed(2);

    console.log(`✅ Physics system initialized (${systemInitTime}s)`);

    // Step 8: Mark as initialized
    this.initialized = true;
  }

  /**
   * Disposes the physics system
   */
  dispose() {
    // Set disposed flag immediately to prevent any updates during disposal
    this.disposed = true;

    /**
     * Clear the interval timer
     */
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = undefined;
    }

    /**
     * Dispose all dynamic objects
     * Use a safety counter to prevent infinite loops
     */
    let safetyCounter = 0;
    const maxIterations = this.dynamicObjects.length + 100; // Allow some extra iterations for safety

    while (this.dynamicObjects.length > 0 && safetyCounter < maxIterations) {
      safetyCounter++;
      const dynamicObj = this.dynamicObjects[0];
      if (!dynamicObj) {
        // Safety check: if dynamicObj is null/undefined, remove it and continue
        this.dynamicObjects.shift();
        continue;
      }

      const obj = dynamicObj.debugMesh as THREE.Mesh;

      // Remove from physics system
      if (dynamicObj.body && this.bodyInterface) {
        try {
          /**
           * Remove the body from the physics system and destroy it
           */
          const id = dynamicObj.body.GetID();
          if (this.bodyInterface.IsAdded(id)) {
            this.bodyInterface.RemoveBody(id);
            this.bodyInterface.DestroyBody(id);
          }
        } catch (error) {
          void error;
          // Body may already be disposed during hot reload or cleanup
          // Silently handle - this is expected during scene switching
        }
      }

      /**
       * Remove the debug mesh from the scene
       */
      try {
        if (this.engine.getScene() && obj) {
          this.engine.getScene().remove(obj);
        }
      } catch (error) {
        // Scene may already be disposed
        void error;
      }

      /**
       * Dispose the debug mesh geometry (materials are cached and will be disposed with cache)
       */
      try {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          obj.geometry.dispose();
          // Note: Materials are shared from materialCache, don't dispose them here
        }
      } catch (error) {
        // Geometry may already be disposed
        void error;
      }

      /**
       * Handle visual group cleanup if registered
       */
      try {
        if (dynamicObj.visualGroup) {
          disposeVisualGroup(this.engine, dynamicObj.visualGroup);
        }
      } catch (error) {
        // Visual group may already be disposed
        void error;
      }

      /**
       * Call custom cleanup callback if provided
       */
      try {
        if (dynamicObj.onRemoveCallback) {
          dynamicObj.onRemoveCallback(dynamicObj.body, dynamicObj.visualGroup);
        }
      } catch (error) {
        // Callback may throw - don't let it block disposal
        void error;
      }

      /**
       * Remove the dynamic object from the array
       */
      this.dynamicObjects.shift();
    }

    // Safety check: if loop didn't complete, clear remaining objects
    if (this.dynamicObjects.length > 0) {
      console.warn(
        `[T3DPhysics] Disposal safety limit reached, clearing ${this.dynamicObjects.length} remaining objects`
      );
      this.dynamicObjects.length = 0;
    }

    /**
     * Destroy the Jolt interface (this will clean up all remaining physics resources)
     */
    try {
      if (this.Jolt && this.joltInterface) {
        this.Jolt.destroy(this.joltInterface);
      }
    } catch (error) {
      // Jolt interface may already be destroyed or in invalid state
      // Silently handle - this is expected during scene switching
      void error;
    }

    /**
     * Dispose the material cache (this disposes all cached materials used by debug meshes)
     */
    this.materialCache.forEach((material) => material.dispose());
    this.materialCache.clear();

    /**
     * Clear the references
     */
    this.joltInterface = undefined as any;
    this.physicsSystem = undefined as any;
    this.bodyInterface = undefined as any;
    this.initialized = false;
    this.initPromise = undefined;
    // Keep disposed flag as true - physics system should not be reused after disposal
  }

  /**
   * Expose the Jolt module for T3DShapeCreator and other utilities
   */
  get jolt(): JoltModule {
    return this.Jolt;
  }

  /**
   * Expose the body interface for T3DBodyCreator
   */
  public getBodyInterface(): BodyInterface {
    return this.bodyInterface;
  }

  /**
   * Expose the physics system for examples
   */
  public getPhysicsSystem(): PhysicsSystem {
    return this.physicsSystem;
  }

  /**
   * Expose the dynamic objects for examples
   */
  public getDynamicObjects(): T3DDynamicObject[] {
    return this.dynamicObjects;
  }

  /**
   * Check if physics system is initialized
   */
  public isInitialized(): boolean {
    return this.initialized && !this.disposed;
  }

  /**
   * Clears all dynamic objects from the physics system without disposing the entire physics system
   * Useful for scene resets where you want to keep physics initialized
   */
  public clearAllBodies(): void {
    const bodyManagerState: BodyManagerState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
    };
    clearAllBodies(bodyManagerState, this.protectedObjects);
  }

  /**
   * Helper method to get Three.js objects for backward compatibility
   */
  public getDebugMeshes(): THREE.Object3D[] {
    return this.dynamicObjects.map((obj) => obj.debugMesh);
  }

  // Expose protectedObjects for examples
  public getProtectedObjects(): Set<T3DDynamicObject> {
    return this.protectedObjects;
  }

  // Helper methods for random value generation
  public randomScalar(min: number, max: number): number {
    return T3DPhysicsUtils.randomScalar(min, max);
  }

  public randomVec3(min: number, max: number): Vec3 {
    return T3DPhysicsUtils.randomVec3(this.Jolt, min, max);
  }

  public randomRVec3(min: number, max: number): RVec3 {
    return T3DPhysicsUtils.randomRVec3(this.Jolt, min, max);
  }

  public randomQuat(): Quat {
    return T3DPhysicsUtils.randomQuat(this.Jolt);
  }

  public wrapVec3(v: Vec3 | RVec3) {
    return T3DPhysicsUtils.wrapVec3(v);
  }

  public wrapRVec3(v: RVec3) {
    return T3DPhysicsUtils.wrapRVec3(v);
  }

  public wrapQuat(q: Quat) {
    return T3DPhysicsUtils.wrapQuat(q);
  }

  public unwrapVec3(v: THREE.Vector3) {
    return T3DPhysicsUtils.unwrapVec3(this.Jolt, v);
  }

  public unwrapRVec3(v: THREE.Vector3) {
    return T3DPhysicsUtils.unwrapRVec3(this.Jolt, v);
  }

  public unwrapQuat(q: THREE.Quaternion) {
    return T3DPhysicsUtils.unwrapQuat(this.Jolt, q);
  }

  public getRandomQuat() {
    return T3DPhysicsUtils.getRandomQuat(this.Jolt);
  }

  /**
   * Update physics simulation: validate/clamp delta time, step physics with sub-stepping,
   * sync body positions/rotations to debug meshes and visual groups, validate for NaN values.
   */
  public update(deltaTimeSeconds: number) {
    // Create update state with direct references to mutable properties
    const updateState: UpdateState = {
      Jolt: this.Jolt,
      joltInterface: this.joltInterface,
      dynamicObjects: this.dynamicObjects, // Array is mutable, changes will persist
      frameCount: this.frameCount,
      accumulatedTime: this.accumulatedTime,
      disposed: this.disposed,
      initialized: this.initialized,
      paused: this.paused,
    };

    updatePhysics(updateState, deltaTimeSeconds);
    // Sync back primitive values that might have been modified
    this.frameCount = updateState.frameCount;
    this.accumulatedTime = updateState.accumulatedTime;
    this.disposed = updateState.disposed;
  }

  /**
   * Start the physics simulation loop
   * Resumes physics updates if they were paused
   */
  public start(): void {
    console.log(
      `[T3DPhysics.start] Called - current paused state: ${this.paused}, initialized: ${this.initialized}`
    );
    const updateState: UpdateState = {
      Jolt: this.Jolt,
      joltInterface: this.joltInterface,
      dynamicObjects: this.dynamicObjects,
      frameCount: this.frameCount,
      accumulatedTime: this.accumulatedTime,
      disposed: this.disposed,
      initialized: this.initialized,
      paused: this.paused,
    };
    startPhysics(updateState);
    this.paused = updateState.paused;
    console.log(
      `[T3DPhysics.start] After startPhysics - paused state: ${this.paused}`
    );
  }

  /**
   * Stop the physics simulation loop
   * Pauses physics updates (bodies remain in their current state)
   */
  public stop(): void {
    const updateState: UpdateState = {
      Jolt: this.Jolt,
      joltInterface: this.joltInterface,
      dynamicObjects: this.dynamicObjects,
      frameCount: this.frameCount,
      accumulatedTime: this.accumulatedTime,
      disposed: this.disposed,
      initialized: this.initialized,
      paused: this.paused,
    };
    stopPhysics(updateState);
    this.paused = updateState.paused;
  }

  /**
   * Check if physics simulation is paused
   * @returns true if physics is paused, false if running
   */
  public isPaused(): boolean {
    const updateState: UpdateState = {
      Jolt: this.Jolt,
      joltInterface: this.joltInterface,
      dynamicObjects: this.dynamicObjects,
      frameCount: this.frameCount,
      accumulatedTime: this.accumulatedTime,
      disposed: this.disposed,
      initialized: this.initialized,
      paused: this.paused,
    };
    return isPaused(updateState);
  }

  /**
   * Registers a physics body with the physics system and creates its visual representation.
   * This method:
   * - Registers the body with the physics system
   * - Creates a debug mesh for visualization
   * - Adds the debug mesh to the scene
   * - Tracks the body in the dynamicObjects array
   */
  public registerPhysicsBody({
    body,
    shapeType,
    visualGroup,
    debugMesh: providedDebugMesh,
    updateVertex: providedUpdateVertex,
    onRemoveCallback,
  }: {
    body: Body;
    shapeType?: number;
    visualGroup?: THREE.Object3D;
    debugMesh?: THREE.Object3D;
    updateVertex?: () => void;
    onRemoveCallback?: (body: Body, visualGroup?: THREE.Object3D) => void;
  }): T3DDynamicObject {
    const bodyManagerState: BodyManagerState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
    };
    return registerPhysicsBody(bodyManagerState, {
      body,
      shapeType,
      visualGroup,
      debugMesh: providedDebugMesh,
      updateVertex: providedUpdateVertex,
      onRemoveCallback,
    });
  }

  /**
   * @deprecated Use registerPhysicsBody instead. This method is kept for backward compatibility.
   */
  public addToScene({
    body,
    shapeType,
    visualGroup,
    onRemoveCallback,
  }: {
    body: Body;
    shapeType?: number;
    visualGroup?: THREE.Object3D;
    onRemoveCallback?: (body: Body, visualGroup?: THREE.Object3D) => void;
  }) {
    return this.registerPhysicsBody({
      body,
      shapeType,
      visualGroup,
      onRemoveCallback,
    });
  }

  public removeFromScene(dynamicObj: T3DDynamicObject) {
    const bodyManagerState: BodyManagerState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
    };
    removeFromScene(bodyManagerState, dynamicObj);
  }

  public addRandomObjectToScene() {
    const bodyFactoryState: BodyFactoryState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
      physicsSystem: this.physicsSystem,
    };
    addRandomObjectToScene(bodyFactoryState);
  }

  /**
   * Creates a debug mesh for the given physics body. The debug mesh provides a Three.js
   * visual representation for the shape, colored and modeled according to the shape type.
   * Optionally, a vertex update callback may be returned for dynamic shapes.
   *
   * Return an object containing the Three.js debugMesh, and optionally an updateVertex callback.
   */
  public createDebugMesh(
    body: Body,
    shapeType: number
  ): {
    debugMesh: THREE.Object3D;
    updateVertex?: () => void;
  } {
    return createDebugMesh(this.Jolt, body, shapeType, this.materialCache);
  }

  public createFloor(size: number = 50) {
    const bodyFactoryState: BodyFactoryState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
      physicsSystem: this.physicsSystem,
    };
    return createFloor(bodyFactoryState, size);
  }

  public createBox(
    position: RVec3,
    rotation: Quat,
    halfExtent: Vec3,
    motionType: number,
    layer: number
  ) {
    const bodyFactoryState: BodyFactoryState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
      physicsSystem: this.physicsSystem,
    };
    return createBox(
      bodyFactoryState,
      position,
      rotation,
      halfExtent,
      motionType,
      layer
    );
  }

  public createSphere(
    position: RVec3,
    radius: number,
    motionType: number,
    layer: number
  ) {
    const bodyFactoryState: BodyFactoryState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
      physicsSystem: this.physicsSystem,
    };
    return createSphere(bodyFactoryState, position, radius, motionType, layer);
  }

  public createMeshForShape(shape: Shape): THREE.BufferGeometry {
    return createMeshForShape(this.Jolt, shape);
  }

  public getSoftBodyMesh(body: Body): {
    debugMesh: THREE.Object3D;
    updateVertex: () => void;
  } {
    const getMaterialFn = (shapeType: number) => {
      return getDebugMeshMaterial(this.Jolt, shapeType, this.materialCache);
    };
    return getSoftBodyMesh(this.Jolt, body, getMaterialFn);
  }

  public createMeshFloor(
    n: number,
    cellSize: number,
    _maxHeight: number,
    posX: number,
    posY: number,
    posZ: number
  ) {
    const bodyFactoryState: BodyFactoryState = {
      Jolt: this.Jolt,
      bodyInterface: this.bodyInterface,
      engine: this.engine,
      dynamicObjects: this.dynamicObjects,
      materialCache: this.materialCache,
      physicsSystem: this.physicsSystem,
    };
    createMeshFloor(
      bodyFactoryState,
      n,
      cellSize,
      _maxHeight,
      posX,
      posY,
      posZ
    );
  }
}
