import * as THREE from 'three';
import type {
  EMotionType,
  Body,
  ConvexHullShapeSettings,
  Vec3,
  RVec3,
  Quat,
  Shape,
} from '../jolt-loader';
import { LAYER_MOVING, T3DPhysics } from '../T3DPhysics';
import { T3DShapeCreator } from '../builders';
import { T3DMeshToConvexHull } from './T3DMeshToConvexHull';

/**
 * T3DModelToCollider
 *
 * Utility class for converting THREE.Group objects (typically from GLB models)
 * into physics colliders. Supports both convex hull and compound shape approaches
 * for creating dynamic physics bodies from hierarchical model structures.
 */
export class T3DModelToCollider extends T3DShapeCreator {
  constructor(physics: T3DPhysics) {
    super(physics);
  }

  /**
   * Merge multiple BufferGeometry objects into a single geometry
   * @private
   */
  private mergeGeometries(
    geometries: THREE.BufferGeometry[]
  ): THREE.BufferGeometry {
    if (geometries.length === 0) {
      return new THREE.BufferGeometry();
    }

    if (geometries.length === 1) {
      return geometries[0].clone();
    }

    // Get total vertex count
    let totalVertexCount = 0;
    for (const geometry of geometries) {
      const positionAttr = geometry.attributes.position;
      if (positionAttr) {
        totalVertexCount += positionAttr.count;
      }
    }

    // Create merged geometry
    const mergedGeometry = new THREE.BufferGeometry();
    const mergedPositions = new Float32Array(totalVertexCount * 3);
    const mergedIndices: number[] = [];

    let vertexOffset = 0;

    for (const geometry of geometries) {
      const positionAttr = geometry.attributes.position;
      if (!positionAttr) continue;

      const positions = positionAttr.array as Float32Array;
      const vertexCount = positionAttr.count;

      // Copy positions
      for (let i = 0; i < vertexCount; i++) {
        const idx = vertexOffset * 3 + i * 3;
        mergedPositions[idx] = positions[i * 3];
        mergedPositions[idx + 1] = positions[i * 3 + 1];
        mergedPositions[idx + 2] = positions[i * 3 + 2];
      }

      // Handle indices if present
      const indexAttr = geometry.index;
      if (indexAttr) {
        const indices = indexAttr.array as Uint32Array | Uint16Array;
        for (let i = 0; i < indices.length; i++) {
          mergedIndices.push(indices[i] + vertexOffset);
        }
      } else {
        // No indices, create them sequentially
        for (let i = 0; i < vertexCount; i++) {
          mergedIndices.push(vertexOffset + i);
        }
      }

      vertexOffset += vertexCount;
    }

    // Set merged attributes
    mergedGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(mergedPositions, 3)
    );

    if (mergedIndices.length > 0) {
      mergedGeometry.setIndex(mergedIndices);
    }

    mergedGeometry.computeVertexNormals();
    mergedGeometry.computeBoundingBox();

    return mergedGeometry;
  }

  /**
   * Helper function to merge child meshes from a Group into a single geometry
   * @public - Made public for use with static mesh colliders
   */
  public mergeGroupMeshes(
    group: THREE.Group
  ): { mergedGeometry: THREE.BufferGeometry; tempMesh: THREE.Mesh } | null {
    // Step 1: Collect all child meshes from the group
    const childMeshes: THREE.Mesh[] = [];
    group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        childMeshes.push(child);
      }
    });

    // Step 2: Validate we have meshes to merge
    if (childMeshes.length === 0) {
      return null;
    }

    // Step 3: Clone and transform geometries from child meshes
    const geometries: THREE.BufferGeometry[] = [];
    childMeshes.forEach((mesh) => {
      // Step 3.1: Clone geometry and apply child's local transform (relative to Group)
      const geometry = mesh.geometry.clone();
      // Apply the mesh's local matrix (not world) to bake in child's transform
      geometry.applyMatrix4(mesh.matrix);
      geometries.push(geometry);
    });

    // Step 4: Merge all geometries into one
    const mergedGeometry = this.mergeGeometries(geometries);

    // Step 5: Validate merged geometry is valid
    if (
      !mergedGeometry.attributes.position ||
      mergedGeometry.attributes.position.count === 0
    ) {
      geometries.forEach((geo) => geo.dispose());
      mergedGeometry.dispose();
      return null;
    }

    // Step 6: Create a temporary mesh for the combined geometry
    const tempMesh = new THREE.Mesh(mergedGeometry);

    // Step 7: Apply group's world transform to temp mesh
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    group.getWorldPosition(worldPosition);
    group.getWorldQuaternion(worldQuaternion);
    group.getWorldScale(worldScale);

    tempMesh.position.copy(worldPosition);
    tempMesh.quaternion.copy(worldQuaternion);
    tempMesh.scale.copy(worldScale);

    // Step 8: Update matrix to apply transforms
    tempMesh.updateMatrixWorld(true);

    // Step 9: Cleanup source geometries
    geometries.forEach((geo) => geo.dispose());

    return { mergedGeometry, tempMesh };
  }

  /**
   * Create a physics body from a Group using Convex Hull shape (supports Dynamic motion type)
   * This approach merges all child meshes into a single convex hull
   *
   * @param group - The THREE.Group containing mesh children
   * @param motionType - Desired motion type (typically EMotionType_Dynamic)
   * @returns The created physics body, or null if creation failed
   */
  public createConvexHullBodyFromGroup(
    group: THREE.Group,
    motionType: EMotionType
  ): Body | null {
    const merged = this.mergeGroupMeshes(group);
    if (!merged) {
      return null;
    }

    const { tempMesh } = merged;
    const convexHullCreator = new T3DMeshToConvexHull(this.physics);

    try {
      const body = convexHullCreator.createConvexHullBodyFromMesh(
        tempMesh,
        motionType,
        group // Pass the visual group
      );
      return body;
    } catch (error) {
      console.warn(
        `Failed to create convex hull body for group "${group.name}":`,
        error
      );
      return null;
    }
  }

  /**
   * Create a physics body from a Group using Compound Shape (supports Dynamic motion type)
   * This approach creates a convex hull for each child mesh and combines them into a compound shape
   * More accurate than single convex hull but more expensive
   *
   * @param group - The THREE.Group containing mesh children
   * @param motionType - Desired motion type (typically EMotionType_Dynamic)
   * @returns The created physics body, or null if creation failed
   */
  public createCompoundBodyFromGroup(
    group: THREE.Group,
    motionType: EMotionType
  ): Body | null {
    const Jolt = this.Jolt;

    // Step 1: Collect all child meshes from the group
    const childMeshes: THREE.Mesh[] = [];
    group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        childMeshes.push(child);
      }
    });

    // Step 2: Validate we have meshes to process
    if (childMeshes.length === 0) {
      return null;
    }

    try {
      // Step 3: Create compound shape settings
      const compoundShapeSettings = new Jolt.StaticCompoundShapeSettings();

      // Step 4: Initialize tracking arrays for cleanup
      const hullSettingsList: ConvexHullShapeSettings[] = [];
      const verticesList: Vec3[][] = [];
      const meshPosList: Vec3[] = [];
      const meshPosRVecList: RVec3[] = [];
      const meshRotList: Quat[] = [];

      // Step 5: For each child mesh, create a convex hull and add it to the compound
      childMeshes.forEach((mesh) => {
        // Step 5.1: Get mesh geometry vertices for convex hull
        const cloned = mesh.geometry.clone().toNonIndexed();
        const posAttr = cloned.attributes.position;
        const vertexCount = posAttr.count;

        // Step 5.2: Validate geometry has vertices
        if (vertexCount === 0) {
          console.warn(
            `Mesh "${mesh.name}" has no vertices, skipping in compound shape`
          );
          cloned.dispose();
          return;
        }

        // Step 5.3: Extract and validate vertices
        const vertices: Vec3[] = [];
        let hasValidVertices = false;

        for (let i = 0; i < vertexCount; ++i) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);

          // Step 5.3.1: Validate vertex coordinates
          if (
            !isFinite(x) ||
            !isFinite(y) ||
            !isFinite(z) ||
            Math.abs(x) > 1e6 ||
            Math.abs(y) > 1e6 ||
            Math.abs(z) > 1e6
          ) {
            console.warn(
              `Mesh "${mesh.name}" has invalid vertex at index ${i}: (${x}, ${y}, ${z}), skipping`
            );
            continue;
          }

          const v = new Jolt.Vec3(x, y, z);
          vertices.push(v);
          hasValidVertices = true;
        }

        // Step 5.4: Validate we have valid vertices
        if (!hasValidVertices || vertices.length === 0) {
          console.warn(
            `Mesh "${mesh.name}" has no valid vertices, skipping in compound shape`
          );
          cloned.dispose();
          // Cleanup vertices we created
          for (const v of vertices) {
            Jolt.destroy(v);
          }
          return;
        }

        // Step 5.5: Validate we have at least 4 points for a convex hull
        if (vertices.length < 4) {
          console.warn(
            `Mesh "${mesh.name}" has only ${vertices.length} vertices (need at least 4), skipping in compound shape`
          );
          cloned.dispose();
          for (const v of vertices) {
            Jolt.destroy(v);
          }
          return;
        }

        // Step 5.6: Create convex hull shape settings for this mesh
        const hullSettings = new Jolt.ConvexHullShapeSettings();
        for (const v of vertices) {
          hullSettings.mPoints.push_back(v);
        }

        // Step 5.7: Validate hull settings have enough points
        if (hullSettings.mPoints.size() < 4) {
          console.warn(
            `Mesh "${mesh.name}" has only ${hullSettings.mPoints.size()} points (need at least 4), skipping in compound shape`
          );
          cloned.dispose();
          for (const v of vertices) {
            Jolt.destroy(v);
          }
          Jolt.destroy(hullSettings);
          return;
        }

        // Step 5.8: Get mesh transform relative to group
        const meshPosRVec = this.physics.unwrapRVec3(mesh.position);
        const meshPos = new Jolt.Vec3(
          meshPosRVec.GetX(),
          meshPosRVec.GetY(),
          meshPosRVec.GetZ()
        );
        const meshRot = this.physics.unwrapQuat(mesh.quaternion);

        // Step 5.9: Validate transform
        if (
          !isFinite(meshPos.GetX()) ||
          !isFinite(meshPos.GetY()) ||
          !isFinite(meshPos.GetZ())
        ) {
          console.warn(
            `Mesh "${mesh.name}" has invalid position, skipping in compound shape`
          );
          cloned.dispose();
          for (const v of vertices) {
            Jolt.destroy(v);
          }
          Jolt.destroy(meshPosRVec);
          Jolt.destroy(meshPos);
          Jolt.destroy(meshRot);
          Jolt.destroy(hullSettings);
          return;
        }

        // Step 5.10: Add shape to compound (AddShape takes ownership of hullSettings)
        compoundShapeSettings.AddShape(
          meshPos,
          meshRot,
          hullSettings,
          0 // SubShapeID
        );

        // Step 5.11: Store for cleanup after compound shape is created
        hullSettingsList.push(hullSettings);
        verticesList.push(vertices);
        meshPosList.push(meshPos);
        meshPosRVecList.push(meshPosRVec);
        meshRotList.push(meshRot);

        cloned.dispose();
      });

      // Step 6: Validate we have any valid shapes
      if (hullSettingsList.length === 0) {
        console.warn(
          `No valid shapes created for group "${group.name}", cannot create compound body`
        );
        // Cleanup
        Jolt.destroy(compoundShapeSettings);
        return null;
      }

      // Step 7: Create the compound shape with error handling
      let compoundShape: Shape;
      try {
        const shapeResult = compoundShapeSettings.Create();
        if (!shapeResult.IsValid()) {
          const errorMsg = shapeResult.GetError();
          console.error(
            `Failed to create compound shape for group "${group.name}": ${errorMsg}`
          );
          // Step 7.1: Cleanup on validation failure
          for (const vertices of verticesList) {
            for (const v of vertices) {
              Jolt.destroy(v);
            }
          }
          for (const meshPosRVec of meshPosRVecList) {
            Jolt.destroy(meshPosRVec);
          }
          for (const meshPos of meshPosList) {
            Jolt.destroy(meshPos);
          }
          for (const meshRot of meshRotList) {
            Jolt.destroy(meshRot);
          }
          for (const hullSettings of hullSettingsList) {
            Jolt.destroy(hullSettings);
          }
          Jolt.destroy(compoundShapeSettings);
          return null;
        }
        compoundShape = shapeResult.Get();
      } catch (error) {
        console.error(
          `Exception creating compound shape for group "${group.name}":`,
          error
        );
        // Step 7.2: Cleanup on exception
        for (const vertices of verticesList) {
          for (const v of vertices) {
            Jolt.destroy(v);
          }
        }
        for (const meshPosRVec of meshPosRVecList) {
          Jolt.destroy(meshPosRVec);
        }
        for (const meshPos of meshPosList) {
          Jolt.destroy(meshPos);
        }
        for (const meshRot of meshRotList) {
          Jolt.destroy(meshRot);
        }
        for (const hullSettings of hullSettingsList) {
          Jolt.destroy(hullSettings);
        }
        Jolt.destroy(compoundShapeSettings);
        return null;
      }

      // Step 8: Cleanup temporary Vec3, RVec3, and Quat objects
      // Note: Vec3 objects in hullSettings.mPoints are copied by push_back, safe to destroy
      // But destroy them BEFORE destroying compoundShapeSettings to avoid issues
      for (const vertices of verticesList) {
        for (const v of vertices) {
          Jolt.destroy(v);
        }
      }
      // Vec3, RVec3, and Quat passed to AddShape are copied, safe to destroy
      for (const meshPosRVec of meshPosRVecList) {
        Jolt.destroy(meshPosRVec);
      }
      for (const meshPos of meshPosList) {
        Jolt.destroy(meshPos);
      }
      for (const meshRot of meshRotList) {
        Jolt.destroy(meshRot);
      }

      // Step 9: Destroy compound shape settings
      // IMPORTANT: Do NOT destroy hullSettings after AddShape - the compound shape settings takes ownership
      // After Create().Get(), the compound shape owns everything, so we only destroy compoundShapeSettings
      try {
        Jolt.destroy(compoundShapeSettings);
      } catch (error) {
        console.warn(
          `Error destroying compoundShapeSettings for group "${group.name}":`,
          error
        );
        // Continue anyway - the shape is already created and owned by the body
      }

      // Step 10: Get group's world transform
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      group.getWorldPosition(worldPosition);
      group.getWorldQuaternion(worldQuaternion);

      const pos = this.physics.unwrapRVec3(worldPosition);
      const rot = this.physics.unwrapQuat(worldQuaternion);

      // Step 11: Create body settings
      const bodySettings = new Jolt.BodyCreationSettings(
        compoundShape,
        pos,
        rot,
        motionType,
        LAYER_MOVING
      );

      // Step 12: Create body
      const body = this.physics.getBodyInterface().CreateBody(bodySettings);

      // Step 13: Cleanup temporary objects
      Jolt.destroy(pos);
      Jolt.destroy(rot);
      Jolt.destroy(bodySettings);

      return body;
    } catch (error) {
      console.warn(
        `Failed to create compound body for group "${group.name}":`,
        error
      );
      return null;
    }
  }
}
