import * as THREE from 'three';
import type { JoltModule, Body, Shape } from '../jolt-loader';
import { USE_NORMAL_MATERIAL } from './T3DPhysicsConfig';
import { createMeshForShape, getSoftBodyMesh } from './T3DPhysicsShapeMesh';
import { T3DPhysicsUtils } from './T3DPhysicsUtils';

/**
 * Unwrap decorated shapes (ScaledShape, RotatedTranslated, etc.) to get the actual inner shape type
 * Recursively unwraps until it finds a non-decorated shape
 * Can accept either a Shape or Body - if Body is passed, extracts the shape from it
 */
export function getShapeType(
  Jolt: JoltModule,
  shapeOrBody: Shape | Body
): number {
  // Step 1: Extract shape from body if needed
  let shape: Shape;
  if ('GetShape' in shapeOrBody && typeof shapeOrBody.GetShape === 'function') {
    shape = shapeOrBody.GetShape();
  } else {
    shape = shapeOrBody as Shape;
  }

  // Step 2: Get shape subtype
  const subType = shape.GetSubType();

  // Step 3: If it's a decorated/wrapper shape, unwrap it
  switch (subType) {
    case Jolt.EShapeSubType_Scaled:
    case Jolt.EShapeSubType_RotatedTranslated:
    case Jolt.EShapeSubType_OffsetCenterOfMass: {
      // Step 3.1: Cast to DecoratedShape to access GetInnerShape()
      const decoratedShape = Jolt.castObject(shape, Jolt.DecoratedShape);
      if (decoratedShape) {
        const innerShape = decoratedShape.GetInnerShape();
        // Step 3.2: Recursively unwrap if needed
        return getShapeType(Jolt, innerShape);
      }
      break;
    }
  }

  // Step 4: Return the actual shape type (not a wrapper)
  return subType;
}

/**
 * Get color for a given shape type
 * Maps each EShapeSubType to a distinct color for visualization
 */
export function getDebugMeshColor(
  Jolt: JoltModule,
  shapeType: number
): THREE.Color {
  /**
   * Map shape types to distinct colors
   */
  switch (shapeType) {
    case Jolt.EShapeSubType_Sphere:
      return new THREE.Color(0xff3333); // Red
    case Jolt.EShapeSubType_Box:
      return new THREE.Color(0xff8800); // Orange
    case Jolt.EShapeSubType_Capsule:
      return new THREE.Color(0xffff00); // Yellow
    case Jolt.EShapeSubType_Cylinder:
      return new THREE.Color(0x88ff00); // Lime
    case Jolt.EShapeSubType_TaperedCapsule:
      return new THREE.Color(0x00ff33); // Green
    case Jolt.EShapeSubType_TaperedCylinder:
      return new THREE.Color(0x00ffcc); // Cyan
    case Jolt.EShapeSubType_ConvexHull:
      return new THREE.Color(0x0088ff); // Light Blue
    case Jolt.EShapeSubType_StaticCompound:
      return new THREE.Color(0x8833ff); // Purple
    case Jolt.EShapeSubType_MutableCompound:
      return new THREE.Color(0xff00ff); // Magenta
    case Jolt.EShapeSubType_OffsetCenterOfMass:
      return new THREE.Color(0xff0088); // Pink
    case Jolt.EShapeSubType_Mesh:
      return new THREE.Color(0x00ffff); // Cyan (brighter)
    case Jolt.EShapeSubType_HeightField:
      return new THREE.Color(0x66ff66); // Light Green
    case Jolt.EShapeSubType_Plane:
      return new THREE.Color(0xc7c7c7); // Gray
    case Jolt.EShapeSubType_Empty:
      return new THREE.Color(0x888888); // Dark Gray
    case Jolt.EShapeSubType_RotatedTranslated:
      return new THREE.Color(0xff8844); // Orange-Red
    case Jolt.EShapeSubType_Scaled:
      return new THREE.Color(0x44ff88); // Green-Cyan
    default:
      return new THREE.Color(0xffffff); // White (fallback)
  }
}

/**
 * Get material for a given shape type
 * Determines color from shape type and returns cached or creates new material
 * Uses MeshNormalMaterial if USE_NORMAL_MATERIAL is true, otherwise MeshStandardMaterial
 */
export function getDebugMeshMaterial(
  Jolt: JoltModule,
  shapeType: number,
  materialCache: Map<
    number,
    THREE.MeshNormalMaterial | THREE.MeshStandardMaterial
  >
): THREE.MeshNormalMaterial | THREE.MeshStandardMaterial {
  // Step 1: Get color for this shape type
  const color = getDebugMeshColor(Jolt, shapeType);

  // Step 2: Check cache for existing material
  let material = materialCache.get(shapeType);
  if (!material) {
    // Step 3: Create new material based on configuration
    if (USE_NORMAL_MATERIAL) {
      // Step 3.1: Create MeshNormalMaterial (colors based on surface normals, no lights needed)
      // Note: MeshNormalMaterial doesn't accept color - it uses normals for coloring
      material = new THREE.MeshNormalMaterial({
        wireframe: true,
        transparent: false,
        opacity: 0.9,
      });
    } else {
      // Step 3.2: Create MeshStandardMaterial (uses Phong shading with color, requires lights)
      material = new THREE.MeshStandardMaterial({
        wireframe: true,
        color: color,
        transparent: false,
        opacity: 0.5,
        metalness: 0,
        roughness: 1,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });
    }
    // Step 4: Cache the material for reuse
    materialCache.set(shapeType, material);
  }
  return material;
}

/**
 * Disables shadows on a Three.js object and all its children.
 * This ensures debug meshes never cast or receive shadows.
 */
export function disableShadowsOnObject(object: THREE.Object3D): void {
  // Set directly on the object if it's a Mesh
  if (object instanceof THREE.Mesh) {
    object.castShadow = false;
    object.receiveShadow = false;
  }
  // Traverse all children to ensure shadows are disabled recursively
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

/**
 * Creates a debug mesh for the given physics body. The debug mesh provides a Three.js
 * visual representation for the shape, colored and modeled according to the shape type.
 * Optionally, a vertex update callback may be returned for dynamic shapes.
 *
 * Return an object containing the Three.js debugMesh, and optionally an updateVertex callback.
 */
export function createDebugMesh(
  Jolt: JoltModule,
  body: Body,
  shapeType: number,
  materialCache: Map<
    number,
    THREE.MeshNormalMaterial | THREE.MeshStandardMaterial
  >
): {
  debugMesh: THREE.Object3D;
  updateVertex?: () => void;
} {
  // Step 1: Get shape from body
  const shape = body.GetShape();

  let geometry: THREE.BufferGeometry;
  let updateVertex: (() => void) | undefined;

  // Step 2: Create geometry based on shape type
  switch (shapeType) {
    case Jolt.EShapeSubType_Box: {
      // Step 2.1: Create box geometry
      const boxShape = Jolt.castObject(shape, Jolt.BoxShape);
      const extent = T3DPhysicsUtils.wrapVec3(
        boxShape.GetHalfExtent()
      ).multiplyScalar(2);
      // Validate extent to prevent NaN geometry
      const validX = isFinite(extent.x) && extent.x > 0 ? extent.x : 1;
      const validY = isFinite(extent.y) && extent.y > 0 ? extent.y : 1;
      const validZ = isFinite(extent.z) && extent.z > 0 ? extent.z : 1;
      geometry = new THREE.BoxGeometry(validX, validY, validZ, 1, 1, 1);
      break;
    }
    case Jolt.EShapeSubType_Sphere: {
      // Step 2.2: Create sphere geometry
      const sphereShape = Jolt.castObject(shape, Jolt.SphereShape);
      const radius = sphereShape.GetRadius();
      // Validate radius to prevent NaN geometry
      const validRadius = isFinite(radius) && radius > 0 ? radius : 0.5;
      // Use only 8 segments for maximum performance (like QJoltPhysics)
      geometry = new THREE.SphereGeometry(validRadius, 8, 8);
      break;
    }
    case Jolt.EShapeSubType_Capsule: {
      // Step 2.3: Create capsule geometry
      const capsuleShape = Jolt.castObject(shape, Jolt.CapsuleShape);
      const radius = capsuleShape.GetRadius();
      const halfHeight = capsuleShape.GetHalfHeightOfCylinder();
      // Validate dimensions to prevent NaN geometry
      const validRadius = isFinite(radius) && radius > 0 ? radius : 0.5;
      const validHeight =
        isFinite(halfHeight) && halfHeight > 0 ? 2 * halfHeight : 1;
      geometry = new THREE.CapsuleGeometry(
        validRadius,
        validHeight,
        4, // Like QJoltPhysics
        8
      );
      break;
    }
    case Jolt.EShapeSubType_Cylinder: {
      // Step 2.4: Create cylinder geometry
      const cylinderShape = Jolt.castObject(shape, Jolt.CylinderShape);
      const radius = cylinderShape.GetRadius();
      const halfHeight = cylinderShape.GetHalfHeight();
      // Validate dimensions to prevent NaN geometry
      const validRadius = isFinite(radius) && radius > 0 ? radius : 0.5;
      const validHeight =
        isFinite(halfHeight) && halfHeight > 0 ? 2 * halfHeight : 1;
      geometry = new THREE.CylinderGeometry(
        validRadius,
        validRadius,
        validHeight,
        8, // Reduced for better performance
        1
      );
      break;
    }
    default:
      // Step 2.5: Handle other shape types (soft bodies or complex shapes)
      if (body.GetBodyType() == Jolt.EBodyType_SoftBody) {
        const getMaterialFn = (st: number) =>
          getDebugMeshMaterial(Jolt, st, materialCache);
        const softBodyResult = getSoftBodyMesh(Jolt, body, getMaterialFn);
        return {
          debugMesh: softBodyResult.debugMesh,
          updateVertex: softBodyResult.updateVertex,
        };
      } else {
        geometry = createMeshForShape(Jolt, shape);
      }
      break;
  }

  // Step 3: Get material for this shape type
  const material = getDebugMeshMaterial(Jolt, shapeType, materialCache);

  // Step 4: Create mesh with wireframe material
  const debugMesh = new THREE.Mesh(geometry, material);

  // Step 5: Validate and set position from body
  const bodyPos = T3DPhysicsUtils.wrapVec3(body.GetPosition());
  // Check and fix NaN positions
  if (isFinite(bodyPos.x) && isFinite(bodyPos.y) && isFinite(bodyPos.z)) {
    debugMesh.position.copy(bodyPos);
  } else {
    console.warn('T3DPhysics: Body position contains NaN, using (0,0,0)');
    debugMesh.position.set(0, 0, 0);
  }

  // Step 6: Validate and set rotation from body
  const bodyRot = T3DPhysicsUtils.wrapQuat(body.GetRotation());
  // Check and fix NaN rotations
  if (
    isFinite(bodyRot.x) &&
    isFinite(bodyRot.y) &&
    isFinite(bodyRot.z) &&
    isFinite(bodyRot.w)
  ) {
    debugMesh.quaternion.copy(bodyRot);
  } else {
    console.warn('T3DPhysics: Body rotation contains NaN, using identity');
    debugMesh.quaternion.set(0, 0, 0, 1);
  }

  // Step 7: Disable shadows for physics debug meshes
  disableShadowsOnObject(debugMesh);

  // Step 8: Mark as debug mesh so it can be excluded from shadow flag updates
  debugMesh.userData.isDebugMesh = true;

  return { debugMesh, updateVertex };
}
