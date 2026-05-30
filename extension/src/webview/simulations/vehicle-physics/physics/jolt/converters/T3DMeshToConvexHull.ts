import * as THREE from 'three';
import type { EMotionType, Body, Vec3 } from '../jolt-loader';
import { LAYER_MOVING, T3DPhysics } from '../T3DPhysics';
import { T3DShapeCreator } from '../builders';

export class T3DMeshToConvexHull extends T3DShapeCreator {
  constructor(physics: T3DPhysics) {
    super(physics);
  }

  public createConvexHullBodyFromMesh(
    mesh: THREE.Mesh,
    motionType?: EMotionType,
    _visualGroup?: THREE.Object3D,
    _onRemoveCallback?: (
      body: Body,
      visualGroup?: THREE.Object3D
    ) => void
  ) {
    // Step 1: Set default motion type if not provided
    if (motionType === undefined) {
      motionType = this.Jolt.EMotionType_Kinematic;
    }
    
    // Step 2: Clone and prepare geometry
    const cloned = mesh.geometry.clone().toNonIndexed();
    cloned.computeVertexNormals(); // Optional
    cloned.computeBoundingBox(); // Optional

    // Step 3: Get position attribute and vertex count
    const posAttr = cloned.attributes.position;
    const vertexCount = posAttr.count;

    // Step 4: Extract vertices from geometry and convert to Jolt.Vec3
    const vertices: Vec3[] = [];
    for (let i = 0; i < vertexCount; ++i) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const v = new this.Jolt.Vec3(x, y, z);
      vertices.push(v);
    }

    // Step 5: Create convex hull shape settings
    const shapeSettings = new this.Jolt.ConvexHullShapeSettings();

    // Step 6: Add all vertices to the convex hull shape settings
    for (let i = 0; i < vertices.length; i++) {
      shapeSettings.mPoints.push_back(vertices[i]);
    }

    // Step 7: Generate the convex hull shape from settings
    const shape = shapeSettings.Create().Get();

    // Step 8: Clean up temporary vertex objects (they are copied by push_back)
    for (const v of vertices) {
      this.Jolt.destroy(v);
    }

    // Step 9: Get world position and rotation of the mesh
    mesh.updateMatrixWorld(true);
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    mesh.getWorldPosition(worldPosition);
    mesh.getWorldQuaternion(worldQuaternion);

    // Step 10: Convert world position and rotation to Jolt-compatible types
    const pos = this.physics.unwrapRVec3(worldPosition);
    const rot = this.physics.unwrapQuat(worldQuaternion);

    // Step 11: Create body settings for the convex hull shape
    const bodySettings = new this.Jolt.BodyCreationSettings(
      shape,
      pos,
      rot,
      motionType,
      LAYER_MOVING
    );

    // Step 12: Create the physics body using the body settings
    const body: Body = this.physics
      .getBodyInterface()
      .CreateBody(bodySettings);

    return body;
  }
}
