import * as THREE from 'three';
import type { JoltModule, Shape, Body } from '../jolt-loader';

/**
 * Creates a THREE.js BufferGeometry from a Jolt Shape
 */
export function createMeshForShape(
  Jolt: JoltModule,
  shape: Shape
): THREE.BufferGeometry {
  // Step 1: Get triangle data from shape
  const scale = new Jolt.Vec3(1, 1, 1);
  const triContext = new Jolt.ShapeGetTriangles(
    shape,
    Jolt.AABox.prototype.sBiggest(),
    shape.GetCenterOfMass(),
    Jolt.Quat.prototype.sIdentity(),
    scale
  );
  Jolt.destroy(scale);

  // Step 2: Get a view on the triangle data (does not make a copy)
  const vertices = new Float32Array(
    Jolt.HEAPF32.buffer,
    triContext.GetVerticesData(),
    triContext.GetVerticesSize() / Float32Array.BYTES_PER_ELEMENT
  );

  // Step 3: Validate and sanitize vertices to prevent NaN values
  const sanitizedVertices = new Float32Array(vertices.length);
  let hasNaN = false;
  for (let i = 0; i < vertices.length; i++) {
    const value = vertices[i];
    if (isFinite(value)) {
      sanitizedVertices[i] = value;
    } else {
      sanitizedVertices[i] = 0;
      hasNaN = true;
    }
  }

  if (hasNaN) {
    console.warn(
      'T3DPhysics: Triangle vertices contain NaN values, sanitized to 0'
    );
  }

  // Step 4: Move the triangle data to a buffer and clone it so that we can free the memory from the C++ heap (which could be limited in size)
  const buffer = new THREE.BufferAttribute(sanitizedVertices, 3).clone();
  Jolt.destroy(triContext);

  // Step 5: Create a THREE.js geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', buffer);

  // Step 6: Compute normals if we have valid vertices
  if (buffer.count > 0 && sanitizedVertices.length > 0) {
    try {
      geometry.computeVertexNormals();
    } catch (error) {
      console.warn(
        'T3DPhysics: Failed to compute vertex normals, geometry may be invalid:',
        error
      );
    }
  }

  return geometry;
}

/**
 * Creates a soft body mesh from a Jolt Body
 * @param Jolt - The Jolt module
 * @param body - The soft body
 * @param getDebugMeshMaterial - Function to get debug mesh material for a shape type
 */
export function getSoftBodyMesh(
  Jolt: JoltModule,
  body: Body,
  getDebugMeshMaterial: (
    shapeType: number
  ) => THREE.MeshNormalMaterial | THREE.MeshStandardMaterial
): {
  debugMesh: THREE.Object3D;
  updateVertex: () => void;
} {
  // Step 1: Get soft body motion properties and settings
  const motionProperties = Jolt.castObject(
    body.GetMotionProperties(),
    Jolt.SoftBodyMotionProperties
  );
  const vertexSettings = motionProperties.GetVertices();
  const settings = motionProperties.GetSettings();
  const positionOffset = Jolt.SoftBodyVertexTraits.prototype.mPositionOffset;
  const faceData = settings.mFaces;

  // Step 2: Get a view on the triangle data (vertex positions)
  const softVertex: Float32Array[] = [];
  for (let i = 0; i < vertexSettings.size(); i++) {
    softVertex.push(
      new Float32Array(
        Jolt.HEAP32.buffer,
        Jolt.getPointer(vertexSettings.at(i)) + positionOffset,
        3
      )
    );
  }

  // Step 3: Define faces (indices of vertices for the triangles)
  const faces = new Uint32Array(faceData.size() * 3);
  for (let i = 0; i < faceData.size(); i++) {
    faces.set(
      new Uint32Array(Jolt.HEAP32.buffer, Jolt.getPointer(faceData.at(i)), 3),
      i * 3
    );
  }

  // Step 4: Create a THREE.js geometry for soft body
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(vertexSettings.size() * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(faces, 1));

  // Step 5: Get material for soft body (default to ConvexHull shape type)
  const shapeType = Jolt.EShapeSubType_ConvexHull;
  const material = getDebugMeshMaterial(shapeType);
  material.side = THREE.DoubleSide;

  // Step 6: Create mesh with wireframe material
  const debugMesh = new THREE.Mesh(geometry, material);

  // Step 7: Disable shadows for physics debug meshes
  debugMesh.castShadow = false;
  debugMesh.receiveShadow = false;

  // Step 8: Mark as debug mesh so it can be excluded from shadow flag updates
  debugMesh.userData.isDebugMesh = true;

  // Step 9: Create vertex update function
  const updateVertex = () => {
    // Step 9.1: Update vertex positions from soft body data
    for (let i = 0; i < softVertex.length; i++) {
      vertices.set(softVertex[i], i * 3);
    }
    // Step 9.2: Recompute normals and mark attributes as needing update
    geometry.computeVertexNormals();
    geometry.getAttribute('position').needsUpdate = true;
    geometry.getAttribute('normal').needsUpdate = true;
  };

  // Step 10: Initialize vertices
  updateVertex();

  return { debugMesh, updateVertex };
}
