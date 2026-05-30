import * as THREE from 'three';
import type { JoltModule, JoltInterface } from '../jolt-loader';
import type { T3DDynamicObject } from './T3DPhysicsBodyManager';
import { T3DPhysicsUtils } from './T3DPhysicsUtils';
import { createMeshForShape } from './T3DPhysicsShapeMesh';

/** Reused when syncing visualGroup transforms from physics world space. */
const _visualWorldPos = new THREE.Vector3();
const _visualWorldQuat = new THREE.Quaternion();
const _visualParentWorldQuat = new THREE.Quaternion();
const _visualLocalQuat = new THREE.Quaternion();

/**
 * Interface for update state
 */
export interface UpdateState {
  Jolt: JoltModule;
  joltInterface: JoltInterface;
  dynamicObjects: T3DDynamicObject[];
  frameCount: number;
  accumulatedTime: number;
  disposed: boolean;
  initialized: boolean;
  paused: boolean;
}

/**
 * Update physics simulation: validate/clamp delta time, step physics with sub-stepping,
 * sync body positions/rotations to debug meshes and visual groups, validate for NaN values.
 */
export function updatePhysics(
  state: UpdateState,
  deltaTimeSeconds: number
): void {
  // Step 1: Validate state - don't update if disposed, not initialized, or paused
  if (
    state.disposed ||
    !state.initialized ||
    !state.Jolt ||
    !state.joltInterface ||
    state.paused
  ) {
    // Debug: Log why physics update is skipped (throttled to avoid spam)
    return;
  }

  const Jolt = state.Jolt;

  // Step 2: Update frame count and accumulated time
  state.frameCount++;
  state.accumulatedTime += deltaTimeSeconds;

  // Step 3: Validate delta time (skip if too small or zero, avoid unnecessary physics steps)
  if (deltaTimeSeconds <= 0 || deltaTimeSeconds > 1.0) return;

  // Step 4: Prevent spiral of death: clamp maximum delta time
  deltaTimeSeconds = Math.min(deltaTimeSeconds, 1.0 / 30.0);

  // Step 5: Calculate sub-stepping parameters
  // Use 30 Hz physics rate with proper sub-stepping
  const physicsHz = 30.0;
  const stepSize = 1.0 / physicsHz;

  // Step 5.1: Calculate number of sub-steps needed
  // At 30 fps: deltaTime = 0.033s, need ~2 steps of 0.0167s each
  let numSteps = Math.ceil(deltaTimeSeconds / stepSize);
  numSteps = Math.min(numSteps, 4); // Cap at 4 sub-steps max for stability

  // Step 5.2: Use actual step size for smoother physics
  const actualStepSize = deltaTimeSeconds / numSteps;

  // Step 6: Step the physics world with sub-stepping
  // Wrap in try-catch to handle cases where physics system is in invalid state (e.g., during hot reload)
  try {
    // Step 6.1: Double-check disposed flag before stepping (may have been set during this frame)
    if (state.disposed || !state.joltInterface) {
      return;
    }
    state.joltInterface.Step(actualStepSize, numSteps);
  } catch (error) {
    void error;
    // Step 6.2: Handle errors (physics system may be in invalid state during hot reload)
    // Set disposed flag to prevent further attempts
    state.disposed = true;
    // Silently handle - this is expected during hot reload/disposal
    // Don't log to avoid console spam during hot reload
    return; // Skip mesh updates if step failed
  }

  //***************************************************************/
  //*** Automatic cleanup: Remove objects that fall below y = -5
  // const objectsToRemove: T3DDynamicObject[] = [];

  // for (let i = 0; i < state.dynamicObjects.length; i++) {
  //   const dynamicObj = state.dynamicObjects[i];
  //   const pos = T3DPhysicsUtils.wrapVec3(dynamicObj.body.GetPosition());
  //   if (pos.y < -15) {
  //     objectsToRemove.push(dynamicObj);
  //   }
  // }

  // for (let i = 0; i < objectsToRemove.length; i++) {
  //   removeFromScene(state, objectsToRemove[i]);
  // }
  //***************************************************************/

  // Step 7: Update all dynamic objects (sync physics to visual representation)
  for (let i = 0, il = state.dynamicObjects.length; i < il; i++) {
    const dynamicObj = state.dynamicObjects[i];
    const debugMesh = dynamicObj.debugMesh as THREE.Mesh;
    const body = dynamicObj.body;

    // Step 7.1: Validate body is still valid before accessing it
    try {
      body.GetID();
    } catch {
      // Body has been destroyed, skip this iteration
      continue;
    }

    // Step 7.2: Get body position and rotation
    let bodyPos: THREE.Vector3;
    let bodyRot: THREE.Quaternion;
    try {
      bodyPos = T3DPhysicsUtils.wrapVec3(body.GetPosition());
      bodyRot = T3DPhysicsUtils.wrapQuat(body.GetRotation());
    } catch {
      // Body destroyed during access, skip this iteration
      continue;
    }

    // Step 7.3: Validate position to prevent NaN values from causing computeBoundingSphere errors
    const isValidPos =
      isFinite(bodyPos.x) && isFinite(bodyPos.y) && isFinite(bodyPos.z);
    const isValidRot =
      isFinite(bodyRot.x) &&
      isFinite(bodyRot.y) &&
      isFinite(bodyRot.z) &&
      isFinite(bodyRot.w);

    // Step 7.4: Update debug mesh and visual group position
    if (isValidPos) {
      debugMesh.position.set(bodyPos.x, bodyPos.y, bodyPos.z);
      // visualGroup may be nested under the GLB root — convert world → local
      if (dynamicObj.visualGroup) {
        const visualGroup = dynamicObj.visualGroup;
        _visualWorldPos.set(bodyPos.x, bodyPos.y, bodyPos.z);
        if (visualGroup.parent) {
          visualGroup.parent.worldToLocal(_visualWorldPos);
        }
        visualGroup.position.copy(_visualWorldPos);
      }
    } else {
      // Skip position update if invalid - prevents NaN propagation
      console.warn('T3DPhysics: Body position contains NaN, skipping update');
    }

    // Step 7.5: Update debug mesh and visual group rotation
    if (isValidRot) {
      debugMesh.quaternion.set(bodyRot.x, bodyRot.y, bodyRot.z, bodyRot.w);
      if (dynamicObj.visualGroup) {
        const visualGroup = dynamicObj.visualGroup;
        _visualWorldQuat.set(bodyRot.x, bodyRot.y, bodyRot.z, bodyRot.w);
        if (visualGroup.parent) {
          visualGroup.parent.getWorldQuaternion(_visualParentWorldQuat);
          _visualLocalQuat.copy(_visualParentWorldQuat.invert()).multiply(
            _visualWorldQuat
          );
          visualGroup.quaternion.copy(_visualLocalQuat);
        }
        else {
          visualGroup.quaternion.copy(_visualWorldQuat);
        }
      }
    } else {
      // Skip rotation update if invalid
      console.warn('T3DPhysics: Body rotation contains NaN, skipping update');
    }

    // Step 7.6: Update matrix world for visual group to ensure proper rendering
    if (dynamicObj.visualGroup && isValidPos && isValidRot) {
      dynamicObj.visualGroup.updateMatrixWorld(true);
    }

    // Step 7.7: Update soft body vertices if needed
    if (body.GetBodyType() == Jolt.EBodyType_SoftBody) {
      if (dynamicObj.updateVertex) {
        dynamicObj.updateVertex();
      } else {
        debugMesh.geometry = createMeshForShape(state.Jolt, body.GetShape());
      }
    }
  }
}

/**
 * Start the physics simulation loop
 * Resumes physics updates if they were paused
 */
export function startPhysics(state: UpdateState): void {
  if (state.disposed) {
    console.warn('[T3DPhysics] Cannot start physics: system is disposed');
    return;
  }
  if (!state.initialized) {
    console.warn(
      '[T3DPhysics] Cannot start physics: system is not initialized'
    );
    return;
  }
  state.paused = false;
}

/**
 * Stop the physics simulation loop
 * Pauses physics updates (bodies remain in their current state)
 */
export function stopPhysics(state: UpdateState): void {
  state.paused = true;
}

/**
 * Check if physics simulation is paused
 * @returns true if physics is paused, false if running
 */
export function isPaused(state: UpdateState): boolean {
  return state.paused;
}
