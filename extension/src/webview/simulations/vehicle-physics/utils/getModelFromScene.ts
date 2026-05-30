/**
 * Utility function to get the model Group from the scene
 * The model is added to the scene by loadScene -> initializeGraphics
 */

import * as THREE from 'three';
import type { VehicleSimulationEngine } from '@vehicle-engine';

/**
 * Gets the model Group from the scene that was loaded by loadScene
 * @param engine - The VehicleSimulationEngine engine instance
 * @returns The model Group if found, null otherwise
 */
export function getModelFromScene(
  engine: VehicleSimulationEngine | null | undefined
): THREE.Group | null {
  if (!engine) {
    return null;
  }

  const scene = engine.getScene();
  if (!scene) {
    return null;
  }

  // Find the model Group in scene.children
  // The model is a THREE.Group that is not a Light, Camera, or the ground mesh
  for (const child of scene.children) {
    // Skip lights
    if (child instanceof THREE.Light) {
      continue;
    }

    // Skip cameras (they're typically not direct children, but check anyway)
    if (child instanceof THREE.Camera) {
      continue;
    }

    // Skip helpers
    if (child.type.includes('Helper')) {
      continue;
    }

    // The model is typically a Group with children
    // Ground is a Mesh, so skip it
    if (child instanceof THREE.Mesh) {
      // This is likely the ground plane, skip it
      continue;
    }

    // If it's a Group, it's likely the model
    if (child instanceof THREE.Group) {
      return child;
    }
  }

  return null;
}
