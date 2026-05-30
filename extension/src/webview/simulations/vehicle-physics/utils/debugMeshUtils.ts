/**
 * Debug mesh utility functions
 */

import * as THREE from 'three';
import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';

/**
 * Set transparency for debug mesh geometry
 * @param obj - The object to set transparency for
 * @param opacity - Opacity value (0-1)
 */
export const setDebugMeshTransparency = (
  obj: THREE.Object3D,
  opacity: number
): void => {
  if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) {
    obj.material.transparent = true;
    obj.material.opacity = opacity;
  } else {
    obj.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.Material
      ) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    });
  }
};

/**
 * Configure debug mesh visibility and color
 * @param debugMesh - The debug mesh to configure
 * @param debugOpacity - Opacity for debug geometry when visible (0 = hidden, >0 = visible)
 * @param debugColor - Optional hex color string (e.g., "#00ff00") to apply to debug mesh materials
 */
export const configureDebugMeshVisibility = (
  debugMesh: THREE.Object3D,
  debugOpacity: number = 0.5,
  debugColor?: string
): void => {
  // Determine visibility based on opacity (0 = hidden, >0 = visible)
  const isVisible = debugOpacity > 0;

  // Find all child debug geometry meshes (marked with userData.isDebugMesh = true)
  // These are the actual debug geometry created by the physics engine, not the visual models added as children
  // Visual models are added as children but don't have the isDebugMesh flag, so they won't be included here
  // NOTE: We exclude the root debug mesh from this list - it should never have its visibility toggled
  // because it's the parent of visual models. We only adjust its opacity.
  const childDebugGeometryMeshes: THREE.Mesh[] = [];
  debugMesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Only include child meshes that are explicitly marked as debug geometry
      // Exclude the root debug mesh (child !== debugMesh) and visual models (no isDebugMesh flag)
      if (child.userData.isDebugMesh === true && child !== debugMesh) {
        childDebugGeometryMeshes.push(child);
      }
    }
  });

  // Set opacity and visibility for debug geometry only
  const finalOpacity = isVisible ? debugOpacity : 0.0;

  // Apply color if provided
  const color = debugColor ? new THREE.Color(debugColor) : null;

  // Root debug mesh: ALWAYS keep visible (never set visible=false) so visual model children remain visible
  // Only adjust its material opacity if it's a debug geometry mesh
  if (debugMesh instanceof THREE.Mesh) {
    debugMesh.visible = true; // Always visible for children (visual models)
    if (
      debugMesh.userData.isDebugMesh === true &&
      debugMesh.material instanceof THREE.Material
    ) {
      debugMesh.material.transparent = true;
      debugMesh.material.opacity = finalOpacity; // Only adjust opacity, never visibility

      // Apply color if provided and material supports it
      if (color) {
        if (debugMesh.material instanceof THREE.MeshStandardMaterial) {
          debugMesh.material.color.copy(color);
        } else if (debugMesh.material instanceof THREE.MeshBasicMaterial) {
          debugMesh.material.color.copy(color);
        } else if (debugMesh.material instanceof THREE.MeshNormalMaterial) {
          // MeshNormalMaterial doesn't support color, replace with MeshBasicMaterial
          const newMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: finalOpacity,
          });
          debugMesh.material = newMaterial;
        }
      }
    }
  }

  // Set visibility and opacity for CHILD debug geometry meshes only (excluding root and visual models)
  childDebugGeometryMeshes.forEach((mesh) => {
    mesh.visible = isVisible; // Child meshes can have visibility toggled
    if (mesh.material instanceof THREE.Material) {
      mesh.material.transparent = true;
      mesh.material.opacity = finalOpacity;

      // Apply color if provided and material supports it
      if (color) {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.copy(color);
        } else if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.color.copy(color);
        } else if (mesh.material instanceof THREE.MeshNormalMaterial) {
          // MeshNormalMaterial doesn't support color, replace with MeshBasicMaterial
          const newMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: finalOpacity,
          });
          mesh.material = newMaterial;
        }
      }
    }
  });

  // Ensure visual model children (those without isDebugMesh flag) are always visible
  debugMesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // If it's not a debug geometry mesh, ensure it's always visible (it's a visual model)
      if (child.userData.isDebugMesh !== true && child !== debugMesh) {
        child.visible = true;
        // Don't modify visual model opacity - keep it as is
      }
    } else if (child instanceof THREE.Object3D) {
      // For non-mesh children (like Groups containing visual models), ensure they're visible
      if (child.userData.isDebugMesh !== true && child !== debugMesh) {
        child.visible = true;
      }
    }
  });
};

/**
 * Set visibility for all debug meshes in the physics system
 * This applies to vehicle body, wheels, balls, and any other physics bodies with debug meshes
 * @param physics - The physics system instance
 * @param visible - Whether to show debug meshes
 * @param opacity - Opacity for debug geometry when visible (default: 0.1)
 */
export const setAllDebugMeshesVisibility = (
  physics: T3DPhysics,
  visible: boolean,
  opacity: number = 0.1
): void => {
  const dynamicObjects = physics.getDynamicObjects();
  const debugOpacity = visible ? opacity : 0.0;

  // Apply visibility to all debug meshes from all dynamic objects
  dynamicObjects.forEach((dynamicObj) => {
    const debugMesh = dynamicObj.debugMesh;
    if (debugMesh) {
      configureDebugMeshVisibility(debugMesh, debugOpacity);
    }
  });
};

/**
 * Set visibility, opacity, and color for vehicle debug mesh (body + wheels)
 * @param physics - The physics system instance
 * @param vehicleBody - The vehicle body reference
 * @param visible - Whether to show the debug mesh
 * @param opacity - Opacity for debug geometry when visible (default: 0.1)
 * @param color - Optional hex color string (e.g., "#00ff00") to apply to debug mesh materials
 */
export const setVehicleDebugMeshVisibility = (
  physics: T3DPhysics,
  vehicleBody: any, // initJolt.Body type
  visible: boolean,
  opacity: number = 0.1,
  color?: string
): void => {
  const dynamicObjects = physics.getDynamicObjects();
  const vehicleObj = dynamicObjects.find((obj) => obj.body === vehicleBody);
  const debugOpacity = visible ? opacity : 0.0;

  if (vehicleObj?.debugMesh) {
    configureDebugMeshVisibility(vehicleObj.debugMesh, debugOpacity, color);
  }
};

/**
 * Set visibility, opacity, and color for all physics objects debug meshes (balls, floor, and other physics objects)
 * @param physics - The physics system instance
 * @param visible - Whether to show the debug meshes
 * @param opacity - Opacity for debug geometry when visible (default: 0.1)
 * @param color - Optional hex color string (e.g., "#ff0000") to apply to debug mesh materials
 */
export const setPhysicsObjectsDebugMeshVisibility = (
  physics: T3DPhysics,
  visible: boolean,
  opacity: number = 0.1,
  color?: string
): void => {
  const dynamicObjects = physics.getDynamicObjects();
  const debugOpacity = visible ? opacity : 0.0;

  dynamicObjects.forEach((dynamicObj) => {
    const debugMesh = dynamicObj.debugMesh;
    // Include balls, floor, and any other physics objects (not vehicle)
    if (
      debugMesh &&
      debugMesh.userData.debugMeshType !== 'vehicle' &&
      debugMesh.userData.debugMeshType !== undefined
    ) {
      configureDebugMeshVisibility(debugMesh, debugOpacity, color);
    }
  });
};
