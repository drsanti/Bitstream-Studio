import type {
  JoltModule,
  PhysicsSystem,
  BodyInterface,
  JoltInterface,
  JoltSettings,
} from '../jolt-loader';
import {
  LAYER_NON_MOVING,
  LAYER_MOVING,
  NUM_OBJECT_LAYERS,
} from './T3DPhysicsConfig';

/**
 * Interface for physics system initialization state
 */
export interface PhysicsInitState {
  Jolt: JoltModule;
  maxWorkerThreads: number;
  joltInterface: JoltInterface;
  physicsSystem: PhysicsSystem;
  bodyInterface: BodyInterface;
  initialized: boolean;
}

/**
 * Setup collision filtering for the physics system
 */
export function setupCollisionFiltering(
  Jolt: JoltModule,
  settings: JoltSettings
): void {
  // Step 1: Create object layer pair filter
  // Layer that objects can be in, determines which other objects it can collide with
  // Typically you at least want to have 1 layer for moving bodies and 1 layer for static bodies, but you can have more
  // layers if you want. E.g. you could have a layer for high detail collision (which is not used by the physics simulation
  // but only if you do collision testing).
  const objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);

  // Step 1.1: Enable collisions between non-moving and moving layers
  objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);

  // Step 1.2: Enable collisions between moving objects
  objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

  // Step 2: Create broadphase layers
  // Each broadphase layer results in a separate bounding volume tree in the broad phase. You at least want to have
  // a layer for non-moving and moving objects to avoid having to update a tree full of static objects every frame.
  // You can have a 1-on-1 mapping between object layers and broadphase layers (like in this case) but if you have
  // many object layers you'll be creating many broad phase trees, which is not efficient.
  const BP_LAYER_NON_MOVING = new Jolt.BroadPhaseLayer(0);
  const BP_LAYER_MOVING = new Jolt.BroadPhaseLayer(1);
  const NUM_BROAD_PHASE_LAYERS = 2;

  // Step 3: Create broadphase layer interface and map object layers to broadphase layers
  const bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(
    NUM_OBJECT_LAYERS,
    NUM_BROAD_PHASE_LAYERS
  );

  // Step 3.1: Map non-moving object layer to non-moving broadphase layer
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_NON_MOVING);

  // Step 3.2: Map moving object layer to moving broadphase layer
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING);

  // Step 4: Configure settings with collision filters
  settings.mObjectLayerPairFilter = objectFilter;
  settings.mBroadPhaseLayerInterface = bpInterface;

  // Step 5: Create object vs broadphase layer filter
  settings.mObjectVsBroadPhaseLayerFilter =
    new Jolt.ObjectVsBroadPhaseLayerFilterTable(
      settings.mBroadPhaseLayerInterface,
      NUM_BROAD_PHASE_LAYERS,
      settings.mObjectLayerPairFilter,
      NUM_OBJECT_LAYERS
    );
}

/**
 * Initialize the physics system: configure settings (worker threads, collision filtering, solver, gravity).
 * The Jolt module must be loaded and provided as a parameter.
 */
export async function initializePhysicsSystem(
  Jolt: JoltModule,
  maxWorkerThreads: number
): Promise<PhysicsInitState> {
  // Step 1: Start timing the physics system initialization
  const systemInitStart = performance.now();
  console.log(
    `⏳ Initializing physics system with ${maxWorkerThreads} worker thread(s)...`
  );

  // Step 2: Create a new Jolt settings object
  const settings = new Jolt.JoltSettings();
  settings.mMaxWorkerThreads = maxWorkerThreads;

  // Step 3: Setup collision filtering
  setupCollisionFiltering(Jolt, settings);

  // Step 4: Create Jolt interface and get physics system
  const joltInterface = new Jolt.JoltInterface(settings);

  // Step 4.1: Destroy settings (no longer needed after creating interface)
  Jolt.destroy(settings);

  // Step 4.2: Get the physics system and body interface
  const physicsSystem = joltInterface.GetPhysicsSystem();
  const bodyInterface = physicsSystem.GetBodyInterface();

  // Step 5: Configure solver iterations (info.md lines 16-18: velocity=6, position=2 for safe defaults)
  const physicsSettings = physicsSystem.GetPhysicsSettings();
  physicsSettings.mNumVelocitySteps = 6; // Default solver iterations
  physicsSettings.mNumPositionSteps = 2; // Default position correction
  physicsSystem.SetPhysicsSettings(physicsSettings);

  // Step 6: Set the gravity
  const gravity = new Jolt.Vec3(0, -9.81 * 1, 0);
  physicsSystem.SetGravity(gravity);
  Jolt.destroy(gravity); // Vec3 is copied by SetGravity, safe to destroy

  // Step 7: Calculate and log initialization times
  const systemInitTime = ((performance.now() - systemInitStart) / 1000).toFixed(
    2
  );

  console.log(`✅ Physics system initialized (${systemInitTime}s)`);

  // Step 8: Return the initialized state
  return {
    Jolt,
    maxWorkerThreads,
    joltInterface,
    physicsSystem,
    bodyInterface,
    initialized: true,
  };
}
