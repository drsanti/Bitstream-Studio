/**
 * Floor creation utilities
 */

import * as THREE from 'three';
import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';
import { T3DColliderCreator } from '@vehicle-jolt/builders/T3DColliderCreator';
import { T3DModelToCollider } from '@vehicle-jolt/converters/T3DModelToCollider';
import { configureDebugMeshVisibility } from './debugMeshUtils';

/**
 * Configure debug mesh visibility for the most recently registered physics body
 * @param physics - Physics system
 */
const configureLastDebugMesh = (physics: T3DPhysics): void => {
  const dynamicObjects = physics.getDynamicObjects();
  const debugMesh = dynamicObjects[dynamicObjects.length - 1]?.debugMesh;
  if (debugMesh) {
    // Mark as floor debug mesh for identification
    debugMesh.userData.debugMeshType = 'floor';
    configureDebugMeshVisibility(debugMesh, 0.3);
  }
};

/**
 * Create floor from model or fallback to default
 * @param physics - Physics system
 * @param floorModel - Floor model from GLB (optional)
 */
export const createFloor = (
  physics: T3DPhysics,
  floorModel?: THREE.Object3D
): void => {
  if (floorModel) {
    try {
      const Jolt = physics.jolt;
      const colliderCreator = new T3DColliderCreator(physics);
      const modelToCollider = new T3DModelToCollider(physics);

      if (floorModel instanceof THREE.Mesh) {
        const floorBody = colliderCreator.createMeshBodyCollider(
          floorModel,
          Jolt.EMotionType_Static
        );
        // Visual stays in the GLB tree; collider debug mesh tracks the body only.
        physics.registerPhysicsBody({ body: floorBody });
        configureLastDebugMesh(physics);
      } else if (floorModel instanceof THREE.Group) {
        const merged = modelToCollider.mergeGroupMeshes(floorModel);
        if (merged) {
          const floorBody = colliderCreator.createMeshBodyCollider(
            merged.tempMesh,
            Jolt.EMotionType_Static
          );
          physics.registerPhysicsBody({ body: floorBody });
          configureLastDebugMesh(physics);
        } else {
          physics.createFloor();
          configureLastDebugMesh(physics);
        }
      } else {
        physics.createFloor();
        configureLastDebugMesh(physics);
      }
    } catch {
      physics.createFloor();
      configureLastDebugMesh(physics);
    }
  } else {
    physics.createFloor();
    configureLastDebugMesh(physics);
  }
};
