/**
 * Ball and object spawning utilities
 */

import * as THREE from 'three';
import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';
import type { JoltModule, Body, BodyInterface } from '@vehicle-jolt/jolt-loader';
import { T3DModelToCollider } from '@vehicle-jolt/converters/T3DModelToCollider';
import { configureDebugMeshVisibility } from './debugMeshUtils';

/**
 * Spawns a single ball as a dynamic physics body at a random position in the air
 * @param ballModel - The ball model from GLB
 * @param physics - Physics system
 * @param Jolt - Jolt physics library
 * @param bodyInterface - Jolt body interface
 * @param index - Optional index for logging
 * @returns The created physics body or null if failed
 */
export const spawnBall = (
  ballModel: THREE.Object3D,
  physics: T3DPhysics,
  Jolt: JoltModule,
  bodyInterface: BodyInterface,
  index?: number
): Body | null => {
  try {
    // Calculate center offset (same for both visual and physics)
    // Use the original model to calculate center
    const box = new THREE.Box3().setFromObject(ballModel);
    const center = box.getCenter(new THREE.Vector3());

    // Clone the ball model for visual representation
    const ballClone = ballModel.clone();
    // Center the visual model (like vehicle body model)
    ballClone.position.sub(center);

    // Ensure cloned ball and all its children are visible (original may be hidden)
    ballClone.visible = true;
    ballClone.traverse((child) => {
      child.visible = true;
    });

    // Create physics body from the ball model
    const modelToCollider = new T3DModelToCollider(physics);
    let body: Body | null = null;

    if (ballModel instanceof THREE.Group) {
      // If it's a Group, clone again for physics and center it
      const physicsClone = ballModel.clone();
      // Center the physics clone the same way as visual model
      // This ensures physics body is created at the centered position
      physicsClone.position.sub(center);
      physicsClone.updateMatrixWorld(true); // Update matrix after centering
      body = modelToCollider.createConvexHullBodyFromGroup(
        physicsClone as THREE.Group,
        Jolt.EMotionType_Dynamic
      );
    } else if (ballModel instanceof THREE.Mesh) {
      // If it's a Mesh, clone for physics, center it, and wrap it in a Group
      const physicsClone = ballModel.clone();
      // Center the physics clone the same way as visual model
      physicsClone.position.sub(center);
      physicsClone.updateMatrixWorld(true); // Update matrix after centering
      const meshGroup = new THREE.Group();
      meshGroup.add(physicsClone);
      meshGroup.updateMatrixWorld(true); // Update group matrix
      body = modelToCollider.createConvexHullBodyFromGroup(
        meshGroup,
        Jolt.EMotionType_Dynamic
      );
    } else {
      console.warn(
        `Ball model is not a Mesh or Group, cannot create physics body`
      );
      return null;
    }

    if (!body) {
      console.warn(`Failed to create physics body for ball ${index ?? ''}`);
      return null;
    }

    // Generate random position in the air
    const x = (Math.random() - 0.5) * 20; // -10 to 10
    const y = 5 + Math.random() * 10; // 5 to 15
    const z = (Math.random() - 0.5) * 20; // -10 to 10

    const position = new Jolt.RVec3(x, y, z);
    bodyInterface.SetPosition(
      body.GetID(),
      position,
      Jolt.EActivation_Activate
    );
    Jolt.destroy(position);

    // Register body with physics system (same as vehicle body - no visualGroup)
    physics.registerPhysicsBody({ body });

    // Get the debug mesh from the physics system and add the visual model to it
    // (same technique as vehicle body and wheels)
    const dynamicObjects = physics.getDynamicObjects();
    const ballDebugMesh = dynamicObjects[dynamicObjects.length - 1].debugMesh;

    if (ballDebugMesh) {
      // Mark as ball debug mesh for identification
      ballDebugMesh.userData.debugMeshType = 'ball';

      // Configure debug mesh visibility
      configureDebugMeshVisibility(ballDebugMesh, 0.5);

      // Add the visual model to the debug mesh (same as vehicle body)
      // The debug mesh position is updated by physics, and ballClone will follow as a child
      // Ensure visibility is set (already set above, but ensure it's still true)
      ballClone.visible = true;
      ballClone.traverse((child) => {
        child.visible = true;
      });
      ballDebugMesh.add(ballClone);
    }

    return body;
  } catch (error) {
    console.error(`Error spawning ball ${index ?? ''}:`, error);
    return null;
  }
};

/**
 * Spawns a single prank object as a dynamic physics body at a random position in the air
 * @param prankModel - The prank model from GLB
 * @param physics - Physics system
 * @param Jolt - Jolt physics library
 * @param bodyInterface - Jolt body interface
 * @param index - Optional index for logging
 * @returns The created physics body or null if failed
 */
export const spawnPrank = (
  prankModel: THREE.Object3D,
  physics: T3DPhysics,
  Jolt: JoltModule,
  bodyInterface: BodyInterface,
  index?: number
): Body | null => {
  try {
    if (!prankModel) {
      console.warn(`Prank model is null for index ${index ?? ''}`);
      return null;
    }
    // Calculate center offset (same for both visual and physics)
    // Use the original model to calculate center
    const box = new THREE.Box3().setFromObject(prankModel);
    const center = box.getCenter(new THREE.Vector3());

    // Clone the prank model for visual representation
    const prankClone = prankModel.clone();
    // Center the visual model (like vehicle body model)
    prankClone.position.sub(center);

    // Ensure cloned prank and all its children are visible (original may be hidden)
    prankClone.visible = true;
    prankClone.traverse((child) => {
      child.visible = true;
    });

    // Create physics body from the prank model
    const modelToCollider = new T3DModelToCollider(physics);
    let body: Body | null = null;

    if (prankModel instanceof THREE.Group) {
      // If it's a Group, clone again for physics and center it
      const physicsClone = prankModel.clone();
      // Center the physics clone the same way as visual model
      // This ensures physics body is created at the centered position
      physicsClone.position.sub(center);
      physicsClone.updateMatrixWorld(true); // Update matrix after centering
      body = modelToCollider.createConvexHullBodyFromGroup(
        physicsClone as THREE.Group,
        Jolt.EMotionType_Dynamic
      );
    } else if (prankModel instanceof THREE.Mesh) {
      // If it's a Mesh, clone for physics, center it, and wrap it in a Group
      const physicsClone = prankModel.clone();
      // Center the physics clone the same way as visual model
      physicsClone.position.sub(center);
      physicsClone.updateMatrixWorld(true); // Update matrix after centering
      const meshGroup = new THREE.Group();
      meshGroup.add(physicsClone);
      meshGroup.updateMatrixWorld(true); // Update group matrix
      body = modelToCollider.createConvexHullBodyFromGroup(
        meshGroup,
        Jolt.EMotionType_Dynamic
      );
    } else {
      console.warn(
        `Prank model is not a Mesh or Group, cannot create physics body`
      );
      return null;
    }

    if (!body) {
      console.warn(`Failed to create physics body for prank ${index ?? ''}`);
      return null;
    }

    // Generate random position in the air
    const x = (Math.random() - 0.5) * 20; // -10 to 10
    const y = 5 + Math.random() * 10; // 5 to 15
    const z = (Math.random() - 0.5) * 20; // -10 to 10

    // Set high mass for prank objects by recreating the body with proper mass settings
    // Since mass must be set during creation, we need to get the body's properties and recreate it
    try {
      const highMass = 10000.0; // Much heavier than vehicle (5000) - makes them hard to move

      // Get the body's properties before destroying it
      const bodyId = body.GetID();
      const shape = body.GetShape();
      if (!shape) {
        throw new Error('Failed to get shape from body');
      }

      const objectLayer = body.GetObjectLayer();

      // Get rotation from the body (position will be set from our calculated values)
      const rot = bodyInterface.GetRotation(bodyId);
      if (!rot) {
        throw new Error('Failed to get rotation from body');
      }

      // Create position with our desired coordinates
      const pos = new Jolt.RVec3(x, y, z);

      // Remove the old body from physics system before destroying it (if it was added)
      // Note: GetShape() should return a reference that keeps the shape alive
      // but to be safe, we'll get all properties before destroying the body
      const wasAdded = bodyInterface.IsAdded(bodyId);
      if (wasAdded) {
        bodyInterface.RemoveBody(bodyId);
      }
      bodyInterface.DestroyBody(bodyId);

      // Create new body settings with high mass
      const bodySettings = new Jolt.BodyCreationSettings(
        shape,
        pos,
        rot,
        Jolt.EMotionType_Dynamic,
        objectLayer
      );

      // Set mass properties override
      bodySettings.mOverrideMassProperties =
        Jolt.EOverrideMassProperties_CalculateInertia;
      bodySettings.mMassPropertiesOverride.mMass = highMass;

      // Create new body with high mass
      const newBody = bodyInterface.CreateBody(bodySettings);
      if (!newBody) {
        throw new Error('CreateBody returned null');
      }

      // Cleanup temporary objects
      Jolt.destroy(pos);
      Jolt.destroy(rot);
      Jolt.destroy(bodySettings);

      // Replace body reference with new body
      body = newBody;

      // Register body with physics system (same as vehicle body - no visualGroup)
      physics.registerPhysicsBody({ body });
    } catch (massError) {
      // If recreation fails, we need to recreate the body from scratch since we destroyed the original
      console.error(
        `Failed to set mass for prank ${index ?? ''}, error details:`,
        massError
      );
      console.warn(`Continuing without mass override for prank ${index ?? ''}`);

      // The original body was already destroyed, so we need to recreate it
      // Use the same creation code but skip mass override
      const modelToCollider2 = new T3DModelToCollider(physics);
      let recreatedBody: Body | null = null;

      if (prankModel instanceof THREE.Group) {
        const physicsClone2 = prankModel.clone();
        physicsClone2.position.sub(center);
        physicsClone2.updateMatrixWorld(true);
        recreatedBody = modelToCollider2.createConvexHullBodyFromGroup(
          physicsClone2 as THREE.Group,
          Jolt.EMotionType_Dynamic
        );
      } else if (prankModel instanceof THREE.Mesh) {
        const physicsClone2 = prankModel.clone();
        physicsClone2.position.sub(center);
        physicsClone2.updateMatrixWorld(true);
        const meshGroup2 = new THREE.Group();
        meshGroup2.add(physicsClone2);
        meshGroup2.updateMatrixWorld(true);
        recreatedBody = modelToCollider2.createConvexHullBodyFromGroup(
          meshGroup2,
          Jolt.EMotionType_Dynamic
        );
      }

      if (recreatedBody) {
        // Set position on the recreated body
        const position = new Jolt.RVec3(x, y, z);
        bodyInterface.SetPosition(
          recreatedBody.GetID(),
          position,
          Jolt.EActivation_Activate
        );
        Jolt.destroy(position);

        body = recreatedBody;
        physics.registerPhysicsBody({ body });
      } else {
        console.error(
          `Failed to recreate body for prank ${index ?? ''} after mass override failure`
        );
        return null;
      }
    }

    // Get the debug mesh from the physics system and add the visual model to it
    // (same technique as vehicle body and wheels)
    const dynamicObjects = physics.getDynamicObjects();
    const prankDebugMesh = dynamicObjects[dynamicObjects.length - 1]?.debugMesh;

    if (prankDebugMesh) {
      // Mark as prank debug mesh for identification
      prankDebugMesh.userData.debugMeshType = 'prank';

      // Configure debug mesh visibility (same as balls)
      configureDebugMeshVisibility(prankDebugMesh, 0.5);

      // Add the visual model to the debug mesh (same as vehicle body)
      // The debug mesh position is updated by physics, and prankClone will follow as a child
      // Ensure visibility is set (already set above, but ensure it's still true)
      prankClone.visible = true;
      prankClone.traverse((child) => {
        child.visible = true;
      });
      prankDebugMesh.add(prankClone);
    } else {
      console.warn(
        `Failed to get debug mesh for prank ${index ?? ''} - dynamicObjects length: ${dynamicObjects.length}`
      );
    }

    return body;
  } catch (error) {
    console.error(`Error spawning prank ${index ?? ''}:`, error);
    return null;
  }
};
