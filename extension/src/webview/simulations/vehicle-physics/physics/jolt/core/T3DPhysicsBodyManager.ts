import * as THREE from 'three';
import type { VehiclePhysicsHost } from '@vehicle-host';
import type { Body, BodyInterface } from '../jolt-loader';
import {
  getShapeType,
  createDebugMesh,
  disableShadowsOnObject,
} from './T3DPhysicsDebugMesh';

/**
 * Represents a dynamic physics object with its Three.js representation and physics body
 */
export interface T3DDynamicObject {
  /** The Three.js object that represents this physics body visually */
  debugMesh: THREE.Object3D;

  /** The Jolt physics body */
  body: Body;

  /** The shape type of the physics body (EShapeSubType) */
  shapeType: number;

  /** Optional function to update vertices for soft bodies */
  updateVertex?: () => void;

  /** Optional visual group (e.g., from GLB model) that should be cleaned up when body is removed */
  visualGroup?: THREE.Object3D;

  /** Optional callback function called when the body is removed from the scene */
  onRemoveCallback?: (body: Body, visualGroup?: THREE.Object3D) => void;
}

/**
 * Interface for body manager state
 */
export interface BodyManagerState {
  Jolt: any;
  bodyInterface: BodyInterface;
  engine: VehiclePhysicsHost;
  dynamicObjects: T3DDynamicObject[];
  materialCache: Map<
    number,
    THREE.MeshNormalMaterial | THREE.MeshStandardMaterial
  >;
}

/**
 * Disposes a visual group and all its children, cleaning up geometries and materials
 */
export function disposeVisualGroup(engine: VehiclePhysicsHost, group: THREE.Object3D): void {
  // Step 1: Traverse and dispose all geometries and materials
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Step 1.1: Dispose geometry
      if (object.geometry) {
        object.geometry.dispose();
      }

      // Step 1.2: Dispose materials and their textures
      if (object.material) {
        if (Array.isArray(object.material)) {
          // Step 1.2.1: Handle array of materials
          object.material.forEach((material) => {
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
            if (material.roughnessMap) material.roughnessMap.dispose();
            if (material.metalnessMap) material.metalnessMap.dispose();
            if (material.aoMap) material.aoMap.dispose();
            if (material.emissiveMap) material.emissiveMap.dispose();
            material.dispose();
          });
        } else {
          // Step 1.2.2: Handle single material
          const material = object.material;
          if (material.map) material.map.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.roughnessMap) material.roughnessMap.dispose();
          if (material.metalnessMap) material.metalnessMap.dispose();
          if (material.aoMap) material.aoMap.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
          material.dispose();
        }
      }
    }
  });

  // Step 2: Remove from parent or scene
  if (group.parent) {
    // Step 2.1: Remove from parent if it exists
    group.parent.remove(group);
  } else {
    // Step 2.2: If no parent, try removing from scene
    const scene = engine.getScene();
    if (scene && scene.children.includes(group)) {
      scene.remove(group);
    }
  }
}

/**
 * Registers a physics body with the physics system and creates its visual representation.
 * This method:
 * - Registers the body with the physics system
 * - Creates a debug mesh for visualization
 * - Adds the debug mesh to the scene
 * - Tracks the body in the dynamicObjects array
 */
export function registerPhysicsBody(
  state: BodyManagerState,
  {
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
  }
): T3DDynamicObject {
  // Step 1: Register body with physics system
  state.bodyInterface.AddBody(body.GetID(), state.Jolt.EActivation_Activate);

  // Step 2: Get shape type from parameter or from the body's shape
  if (shapeType === undefined) {
    // Step 2.1: Unwrap decorated shapes to get the actual inner shape type
    shapeType = getShapeType(state.Jolt, body);
  }

  // Step 3: Use provided debug mesh or create a new one
  let debugMesh: THREE.Object3D;
  let updateVertex: (() => void) | undefined;

  if (providedDebugMesh) {
    // Step 3.1: Use provided debug mesh
    debugMesh = providedDebugMesh;
    // Use provided updateVertex if available, otherwise undefined
    updateVertex = providedUpdateVertex;
  } else {
    // Step 3.2: Create new debug mesh
    const debugMeshResult = createDebugMesh(
      state.Jolt,
      body,
      shapeType,
      state.materialCache
    );
    debugMesh = debugMeshResult.debugMesh;
    // Use provided updateVertex if available, otherwise use the one from createDebugMesh
    updateVertex = providedUpdateVertex ?? debugMeshResult.updateVertex;
  }

  // Step 4: Create dynamic object record
  const dynamicObj: T3DDynamicObject = {
    debugMesh,
    body,
    shapeType,
    updateVertex,
    visualGroup,
    onRemoveCallback,
  };

  // Step 5: Add debug mesh to scene
  const scene = state.engine.getScene();
  if (!scene) {
    throw new Error(
      'Cannot register physics body: Scene is not initialized. Please call engine.initializeGraphics() before creating physics bodies.'
    );
  }
  scene.add(debugMesh);

  // Step 6: Ensure shadows are disabled after adding to scene (in case anything overrides them)
  disableShadowsOnObject(debugMesh);

  // Step 7: Track the dynamic object
  state.dynamicObjects.push(dynamicObj);

  return dynamicObj;
}

/**
 * Removes a physics body from the scene and disposes its resources
 */
export function removeFromScene(
  state: BodyManagerState,
  dynamicObj: T3DDynamicObject
): void {
  // Step 1: Remove and destroy body from physics system
  const id = dynamicObj.body.GetID();
  state.bodyInterface.RemoveBody(id);
  state.bodyInterface.DestroyBody(id);

  // Step 2: Remove debug mesh from scene
  const scene = state.engine.getScene();
  if (scene) {
    scene.remove(dynamicObj.debugMesh);
  }

  // Step 3: Dispose debug mesh geometry (materials are cached and should not be disposed here)
  const debugMesh = dynamicObj.debugMesh;
  if (debugMesh instanceof THREE.Mesh) {
    debugMesh.geometry?.dispose();
    // Note: Materials are shared from materialCache, don't dispose them here
  }

  // Step 4: Handle visual group cleanup if registered
  if (dynamicObj.visualGroup) {
    disposeVisualGroup(state.engine, dynamicObj.visualGroup);
  }

  // Step 5: Call custom cleanup callback if provided
  if (dynamicObj.onRemoveCallback) {
    dynamicObj.onRemoveCallback(dynamicObj.body, dynamicObj.visualGroup);
  }

  // Step 6: Remove from dynamic objects array
  const idx = state.dynamicObjects.indexOf(dynamicObj);
  if (idx !== -1) {
    state.dynamicObjects.splice(idx, 1);
  }
}

/**
 * Clears all dynamic objects from the physics system without disposing the entire physics system
 * Useful for scene resets where you want to keep physics initialized
 */
export function clearAllBodies(
  state: BodyManagerState,
  protectedObjects: Set<T3DDynamicObject>
): void {
  // Step 1: Validate state is ready
  if (!state.Jolt || !state.bodyInterface) {
    return;
  }

  // Step 2: Dispose all dynamic objects
  while (state.dynamicObjects.length > 0) {
    const dynamicObj = state.dynamicObjects[0];
    const obj = dynamicObj.debugMesh as THREE.Mesh;

    // Step 2.1: Remove the body from the physics system
    if (dynamicObj.body) {
      const id = dynamicObj.body.GetID();
      state.bodyInterface.RemoveBody(id);
      state.bodyInterface.DestroyBody(id);
    }

    // Step 2.2: Remove the debug mesh from the scene
    const scene = state.engine.getScene();
    if (scene) {
      scene.remove(obj);
    }

    // Step 2.3: Dispose the debug mesh geometry (materials are cached and will be disposed with cache)
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      // Note: Materials are shared from materialCache, don't dispose them here
    }

    // Step 2.4: Handle visual group cleanup if registered
    if (dynamicObj.visualGroup) {
      disposeVisualGroup(state.engine, dynamicObj.visualGroup);
    }

    // Step 2.5: Call custom cleanup callback if provided
    if (dynamicObj.onRemoveCallback) {
      dynamicObj.onRemoveCallback(dynamicObj.body, dynamicObj.visualGroup);
    }

    // Step 2.6: Remove the dynamic object from the array
    state.dynamicObjects.shift();
  }

  // Step 3: Clear the protected objects set
  protectedObjects.clear();
}
