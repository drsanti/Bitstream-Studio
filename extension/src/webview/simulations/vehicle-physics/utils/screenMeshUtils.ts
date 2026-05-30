/**
 * Screen Mesh Utilities
 * Helper functions for creating and disposing screen meshes for vehicle cameras
 */

import * as THREE from 'three';
import { VehicleCamera } from '../vehicle/VehicleCamera';

/**
 * Find the body model clone within the vehicle debug mesh
 * @param vehicleDebugMesh - The debug mesh containing the vehicle model
 * @returns The body model clone or null if not found
 */
function findBodyModelClone(
  vehicleDebugMesh: THREE.Object3D
): THREE.Object3D | null {
  // Find the body model clone - it's the visual model that's not a debug mesh
  // and doesn't have updateLocalTransform (wheels have that)
  for (const child of vehicleDebugMesh.children) {
    if (!child.userData.isDebugMesh && !(child as any).updateLocalTransform) {
      return child;
    }
  }
  return null;
}

/**
 * Create and attach a screen mesh to display camera feed on the vehicle
 * @param vehicleCamera - The vehicle camera instance
 * @param vehicleDebugMesh - The debug mesh containing the vehicle model
 * @returns The created screen mesh, or null if creation failed
 */
export function createScreenMesh(
  vehicleCamera: VehicleCamera,
  vehicleDebugMesh: THREE.Object3D | null | undefined
): THREE.Mesh | null {
  if (!vehicleDebugMesh) {
    console.warn('Vehicle debug mesh not found - cannot create screen mesh');
    return null;
  }

  const bodyModelClone = findBodyModelClone(vehicleDebugMesh);
  if (!bodyModelClone) {
    console.warn('Body model clone not found - cannot create screen mesh');
    return null;
  }

  // Create screen mesh to display camera feed
  const screenGeometry = new THREE.PlaneGeometry(2, 2);
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: vehicleCamera.getTexture(),
    side: THREE.DoubleSide,
  });
  const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);

  // Position screen relative to car body (in body local space)
  // Position: 0m right, 1.5m up, -1.5m forward (behind vehicle)
  screenMesh.position.set(0, 1.5, -1.5);
  // Rotate to face forward (toward the front of the vehicle)
  screenMesh.rotation.y = 0;

  // Attach screen to car body model so it moves with the car
  bodyModelClone.add(screenMesh);

  // Hide screen mesh during camera render to prevent feedback loop
  vehicleCamera.addObjectToHide(screenMesh);

  return screenMesh;
}

/**
 * Dispose of a screen mesh and remove it from the camera's hide list
 * @param screenMesh - The screen mesh to dispose
 * @param vehicleCamera - The vehicle camera instance (optional, for cleanup)
 */
export function disposeScreenMesh(
  screenMesh: THREE.Mesh | null,
  vehicleCamera: VehicleCamera | null | undefined
): void {
  if (!screenMesh) return;

  // Remove from camera's hide list before disposing camera
  if (vehicleCamera) {
    vehicleCamera.removeObjectToHide(screenMesh);
  }

  // Remove from vehicle debug mesh (or scene if somehow not attached to vehicle)
  if (screenMesh.parent) {
    screenMesh.parent.remove(screenMesh);
  }

  // Dispose geometry
  if (screenMesh.geometry) {
    screenMesh.geometry.dispose();
  }

  // Dispose material(s)
  if (screenMesh.material) {
    if (Array.isArray(screenMesh.material)) {
      screenMesh.material.forEach((mat) => mat.dispose());
    } else {
      screenMesh.material.dispose();
    }
  }
}
