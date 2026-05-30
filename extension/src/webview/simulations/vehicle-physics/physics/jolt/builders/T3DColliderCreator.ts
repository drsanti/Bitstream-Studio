import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  CreateBodyParams,
  CreateBoxBodyParams,
  CreateCapsuleBodyParams,
  CreateCylinderBodyParams,
  CreateMeshBodyParams,
  CreateSphereBodyParams,
  CreateTaperedCapsuleBodyParams,
  CreateTaperedCylinderBodyParams,
  T3DBodyCreator,
} from './T3DBodyCreator';
import type {
  EMotionType,
  Body,
  BoxShapeSettings,
  SphereShapeSettings,
  CylinderShapeSettings,
  CapsuleShapeSettings,
  TaperedCapsuleShapeSettings,
  TaperedCylinderShapeSettings,
  MeshShapeSettings,
  ShapeSettings,
  StaticCompoundShapeSettings,
  RVec3,
  Quat,
} from '../jolt-loader';
import { LAYER_MOVING, LAYER_NON_MOVING, T3DPhysics } from '../T3DPhysics';
import { Config } from './T3DShapeCreator';

// export const SINGLE_COLLIDER_MOTION_TYPE = this.Jolt.EMotionType_Dynamic;
// export const COMPOUND_COLLIDER_MOTION_TYPE = this.Jolt.EMotionType_Dynamic;

// export const SINGLE_COLLIDER_DEBUG_COLOR = 0x88ffff;
// export const COMPOUND_COLLIDER_DEBUG_COLOR = 0xff88ff;

export type ColliderShapeType =
  | 'Box'
  | 'Capsule'
  | 'Cylinder'
  | 'Sphere'
  | 'TaperedCapsule'
  | 'TaperedCylinder'
  | 'Mesh';

export class T3DColliderCreator extends T3DBodyCreator {
  constructor(physics: T3DPhysics) {
    super(physics);
    console.log(`Collider creator initialized.`);
  }

  public getMeshByName(name: string, scene: THREE.Scene | THREE.Group) {
    const mesh = scene.getObjectByName(name) as THREE.Mesh;
    if (!mesh) {
      throw new Error(`Mesh with name "${name}" not found in the scene.`);
    }
    return mesh;
  }

  public getMeshesByNames(names: string[], scene: THREE.Scene | THREE.Group) {
    return names.map((name) => this.getMeshByName(name, scene));
  }

  public getBoundingBox(mesh: THREE.Mesh): THREE.Box3 {
    // Step 1: Save the current position and rotation
    const position = mesh.position.clone();
    const quaternion = mesh.quaternion.clone();

    // Step 2: Reset position and rotation to origin for accurate bounding box calculation
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);

    // Step 3: Calculate the bounding box
    const boundingBox = new THREE.Box3().setFromObject(mesh);

    // Step 4: Restore the original position and rotation
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);

    return boundingBox;
  }

  public getColorByMotionType(motionType: EMotionType): number {
    switch (motionType) {
      case this.Jolt.EMotionType_Dynamic:
        return 0xff88ff;
      case this.Jolt.EMotionType_Kinematic:
        return 0x88ffff;
      case this.Jolt.EMotionType_Static:
        return 0xffff88;
      default:
        return 0x888888;
    }
  }

  public getLayerIndexByMotionType(motionType: EMotionType): number {
    switch (motionType) {
      case this.Jolt.EMotionType_Dynamic:
        return LAYER_MOVING;
      case this.Jolt.EMotionType_Kinematic:
        return LAYER_MOVING;
      case this.Jolt.EMotionType_Static:
        return LAYER_NON_MOVING;
      default:
        return LAYER_NON_MOVING;
    }
  }

  //**********************************************************************************************/
  //**                                Get Body Params Methods                                   **/
  //**********************************************************************************************/

  public getBodyParams(
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateBodyParams {
    mesh.updateMatrixWorld(true);
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    mesh.getWorldPosition(worldPosition);
    mesh.getWorldQuaternion(worldQuaternion);

    const params: CreateBodyParams = {
      position: this.physics.unwrapRVec3(worldPosition),
      rotation: this.physics.unwrapQuat(worldQuaternion),
      motionType: motionType,
      layerIndex: this.getLayerIndexByMotionType(motionType),
      debugParams: { color: this.getColorByMotionType(motionType) },
      graphicsParams: { mesh },
    };
    return params;
  }

  public getBoxColliderParams(
    boxMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateBoxBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(boxMesh);

    // 📩 Return parameters
    const params: CreateBoxBodyParams = {
      shapeParams: {
        halfExtents: new this.Jolt.Vec3(
          (boundingBox.max.x - boundingBox.min.x) / 2 + 0.05,
          (boundingBox.max.y - boundingBox.min.y) / 2 + 0.05,
          (boundingBox.max.z - boundingBox.min.z) / 2 + 0.05
        ),
      },
      bodyParams: this.getBodyParams(boxMesh, motionType),
    };
    return params;
  }

  public getSphereCollierParams(
    sphereMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateSphereBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(sphereMesh);

    // 📩 Return parameters
    const params: CreateSphereBodyParams = {
      shapeParams: {
        radius: (boundingBox.max.x - boundingBox.min.x) / 2 + 0.05,
      },
      bodyParams: this.getBodyParams(sphereMesh, motionType),
    };
    return params;
  }

  public getCylinderColliderParams(
    cylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateCylinderBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(cylinderMesh);

    // 📩 Return parameters
    const params: CreateCylinderBodyParams = {
      shapeParams: {
        halfHeight: (boundingBox.max.y - boundingBox.min.y) / 2,
        radius: (boundingBox.max.x - boundingBox.min.x) / 2 + 0.05,
      },
      bodyParams: this.getBodyParams(cylinderMesh, motionType),
    };
    return params;
  }

  public getCapsuleColliderParams(
    capsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateCapsuleBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(capsuleMesh);

    // 📩 Return parameters
    const radius = (boundingBox.max.x - boundingBox.min.x) / 2;
    const params: CreateCapsuleBodyParams = {
      shapeParams: {
        halfHeight: (boundingBox.max.y - boundingBox.min.y) / 2 - radius,
        radius: radius,
      },
      bodyParams: this.getBodyParams(capsuleMesh, motionType),
    };
    return params;
  }

  public getTaperedCapsuleColliderParams(
    taperedCapsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateTaperedCapsuleBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(taperedCapsuleMesh);

    // Calculate dimensions
    const halfHeight = (boundingBox.max.y - boundingBox.min.y) / 2;
    const xRadius = (boundingBox.max.x - boundingBox.min.x) / 2;
    const zRadius = (boundingBox.max.z - boundingBox.min.z) / 2;

    // For tapered shapes, use larger radius for top, smaller for bottom
    // If dimensions are similar, make bottom 80% of top to ensure tapering
    const topRadius = Math.max(xRadius, zRadius) + 0.05;
    const bottomRadius = Math.min(xRadius, zRadius) + 0.05;

    // 📩 Return parameters
    const params: CreateTaperedCapsuleBodyParams = {
      shapeParams: {
        halfHeight: halfHeight,
        topRadius: topRadius,
        bottomRadius: bottomRadius < topRadius ? bottomRadius : topRadius * 0.8,
      },
      bodyParams: this.getBodyParams(taperedCapsuleMesh, motionType),
    };
    return params;
  }

  public getTaperedCylinderColliderParams(
    taperedCylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateTaperedCylinderBodyParams {
    // 📦 Calculate the bounding box
    const boundingBox = this.getBoundingBox(taperedCylinderMesh);

    // Calculate dimensions
    const halfHeight = (boundingBox.max.y - boundingBox.min.y) / 2;
    const xRadius = (boundingBox.max.x - boundingBox.min.x) / 2;
    const zRadius = (boundingBox.max.z - boundingBox.min.z) / 2;

    // For tapered shapes, use larger radius for top, smaller for bottom
    // If dimensions are similar, make bottom 80% of top to ensure tapering
    const topRadius = Math.max(xRadius, zRadius) + 0.05;
    const bottomRadius = Math.min(xRadius, zRadius) + 0.05;

    // 📩 Return parameters
    const params: CreateTaperedCylinderBodyParams = {
      shapeParams: {
        halfHeight: halfHeight,
        topRadius: topRadius,
        bottomRadius: bottomRadius < topRadius ? bottomRadius : topRadius * 0.8,
      },
      bodyParams: this.getBodyParams(taperedCylinderMesh, motionType),
    };
    return params;
  }

  public getMeshBodyColliderParams(
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CreateMeshBodyParams {
    // Step 1: Clone geometry and bake world transform (static mesh colliders)
    mesh.updateMatrixWorld(true);
    const cloned = mesh.geometry.clone().toNonIndexed();
    cloned.applyMatrix4(mesh.matrixWorld);
    cloned.computeVertexNormals(); // Optional
    cloned.computeBoundingBox(); // Optional

    // Step 2: Get position attribute and vertex count
    const posAttr = cloned.attributes.position;
    const vertexCount = posAttr.count;

    // Step 3: Create vertex and index lists
    const vertices = new this.Jolt.VertexList();
    const indices = new this.Jolt.IndexedTriangleList();

    // Step 4: Extract vertices from geometry
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const v = new this.Jolt.Float3(x, y, z);
      vertices.push_back(v);
    }

    // Step 5: Create triangle indices (every 3 vertices = 1 triangle)
    const triangleCount = Math.floor(vertexCount / 3);
    for (let i = 0; i < triangleCount; i++) {
      const idx = i * 3;
      indices.push_back(
        new this.Jolt.IndexedTriangle(idx, idx + 1, idx + 2, 0)
      );
    }

    // Step 6: Body at world origin — vertices already in world space
    const params: CreateMeshBodyParams = {
      shapeParams: {
        vertices: vertices,
        indices: indices,
        materials: new this.Jolt.PhysicsMaterialList(),
      },
      bodyParams: {
        position: this.physics.unwrapRVec3(new THREE.Vector3(0, 0, 0)),
        rotation: this.physics.unwrapQuat(new THREE.Quaternion(0, 0, 0, 1)),
        motionType: motionType,
        layerIndex: this.getLayerIndexByMotionType(motionType),
        debugParams: { color: this.getColorByMotionType(motionType) },
        graphicsParams: { mesh },
      },
    };

    return params;
  }

  //**********************************************************************************************/
  //**                              Create Body Collider Methods                                **/
  //**********************************************************************************************/

  public createBoxBodyCollider(
    boxMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getBoxColliderParams(boxMesh as THREE.Mesh, motionType);
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the sphere body based on the parameters
    return this.createBoxBody(params);
  }

  public createSphereBodyCollider(
    cylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getSphereCollierParams(
      cylinderMesh as THREE.Mesh,
      motionType
    );
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the sphere body based on the parameters
    return this.createSphereBody(params);
  }

  public createCylinderBodyCollider(
    cylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getCylinderColliderParams(
      cylinderMesh as THREE.Mesh,
      motionType
    );
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the cylinder body based on the parameters
    return this.createCylinderBody(params);
  }

  public createCapsuleBodyCollider(
    capsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getCapsuleColliderParams(
      capsuleMesh as THREE.Mesh,
      motionType
    );
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the cylinder body based on the parameters
    return this.createCapsuleBody(params);
  }

  public createTaperedCapsuleBodyCollider(
    taperedCapsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getTaperedCapsuleColliderParams(
      taperedCapsuleMesh as THREE.Mesh,
      motionType
    );
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the tapered capsule body based on the parameters
    return this.createTaperedCapsuleBody(params);
  }

  public createTaperedCylinderBodyCollider(
    taperedCylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    // 🛠️ Get the parameters from the mesh and override the motion type
    const params = this.getTaperedCylinderColliderParams(
      taperedCylinderMesh as THREE.Mesh,
      motionType
    );
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the tapered cylinder body based on the parameters
    return this.createTaperedCylinderBody(params);
  }

  /**
   * Creates a mesh body collider (MeshShape) from the given mesh geometry.
   * This method extracts vertices and triangle indices from the mesh and creates
   * a concave mesh collider that accurately represents the exact shape of the mesh,
   * including concave details like holes and indentations.
   *
   * **IMPORTANT LIMITATION**: This method only supports `EMotionType_Static` motion type.
   * This is a Jolt Physics engine restriction - MeshShape colliders cannot be used
   * for dynamic or kinematic bodies due to performance and stability constraints.
   *
   * **Behavior**: If `EMotionType_Dynamic` is passed, it will be automatically converted
   * to `EMotionType_Static` with a console warning.
   *
   * **Advantage**: For static bodies, this method provides the most accurate collision
   * detection as it preserves all concave details of the mesh geometry, unlike convex
   * shapes which simplify the geometry.
   *
   * **For Dynamic Bodies**: Use convex shapes instead:
   * - `createBoxBodyCollider()` for simple box shapes
   * - `T3DMeshToConvexHull.createConvexHullBodyFromMesh()` for complex shapes
   * - `T3DModelToCollider.createCompoundBodyFromGroup()` for compound shapes
   *
   * @param mesh - The THREE.Mesh object representing the mesh to create the collider for.
   * @param motionType - The motion type of the collider. Only `EMotionType_Static` is supported.
   *                    Dynamic/Kinematic types will be automatically converted to Static.
   * @returns The created mesh body collider (Body).
   */
  public createMeshBodyCollider(
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Static
  ): Body {
    if (motionType == this.Jolt.EMotionType_Dynamic) {
      console.warn('Dynamic motion type is not supported for mesh bodies.');
      motionType = this.Jolt.EMotionType_Static;
    }

    const params = this.getMeshBodyColliderParams(mesh, motionType);

    // 🛠️ Get the parameters from the mesh and override the motion type
    params.bodyParams = { ...params.bodyParams };

    // 🛠️ Create the cylinder body based on the parameters
    const body = this.createMeshBody(params);

    return body;
  }

  //**********************************************************************************************/
  //**                              Get Shape Settings Methods                                  **/
  //**********************************************************************************************/

  public getBoxShapeSettings(
    boxMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): BoxShapeSettings {
    const { shapeParams } = this.getBoxColliderParams(boxMesh, motionType);
    if (!shapeParams?.halfExtents) {
      throw new Error('Box shape params are missing halfExtents');
    }
    const boxHalfExtents = shapeParams.halfExtents;
    const material = shapeParams.material;
    const boxShapeSettings = new this.Jolt.BoxShapeSettings(
      boxHalfExtents,
      Config.covexRadius
    );
    if (material) {
      boxShapeSettings.mMaterial = material;
    }
    return boxShapeSettings;
  }

  public getSphereShapeSettings(
    sphereMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): SphereShapeSettings {
    const { shapeParams } = this.getSphereCollierParams(sphereMesh, motionType);
    if (!shapeParams?.radius) {
      throw new Error('Sphere shape params are missing radius');
    }
    const sphereRadius = shapeParams.radius;
    const material = shapeParams.material;
    const sphereShapeSettings = new this.Jolt.SphereShapeSettings(sphereRadius);
    if (material) {
      sphereShapeSettings.mMaterial = material;
    }
    return sphereShapeSettings;
  }

  public getCylinderShapeSettings(
    cylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CylinderShapeSettings {
    const { shapeParams } = this.getCylinderColliderParams(
      cylinderMesh,
      motionType
    );
    if (!shapeParams?.halfHeight || !shapeParams?.radius) {
      throw new Error('Cylinder shape params are missing halfHeight or radius');
    }
    const cylinderHalfHeight = shapeParams.halfHeight;
    const cylinderRadius = shapeParams.radius;
    const covexRadius = Config.covexRadius;
    const material = shapeParams.material;
    const cylinderShapeSettings = new this.Jolt.CylinderShapeSettings(
      cylinderHalfHeight,
      cylinderRadius,
      covexRadius
    );
    if (material) {
      cylinderShapeSettings.mMaterial = material;
    }
    return cylinderShapeSettings;
  }

  public getCapsuleShapeSettings(
    capsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): CapsuleShapeSettings {
    const { shapeParams } = this.getCapsuleColliderParams(
      capsuleMesh,
      motionType
    );
    if (!shapeParams?.halfHeight || !shapeParams?.radius) {
      throw new Error('Capsule shape params are missing halfHeight or radius');
    }
    const capsuleHalfHeight = shapeParams.halfHeight;
    const capsuleRadius = shapeParams.radius;
    const material = shapeParams.material;
    const capsuleShapeSettings = new this.Jolt.CapsuleShapeSettings(
      capsuleHalfHeight,
      capsuleRadius
    );
    if (material) {
      capsuleShapeSettings.mMaterial = material;
    }
    return capsuleShapeSettings;
  }

  public getTaperedCapsuleShapeSettings(
    taperedCapsuleMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): TaperedCapsuleShapeSettings {
    const { shapeParams } = this.getTaperedCapsuleColliderParams(
      taperedCapsuleMesh,
      motionType
    );
    if (
      !shapeParams?.halfHeight ||
      !shapeParams?.topRadius ||
      !shapeParams?.bottomRadius
    ) {
      throw new Error(
        'TaperedCapsule shape params are missing halfHeight, topRadius, or bottomRadius'
      );
    }
    const halfHeight = shapeParams.halfHeight;
    const topRadius = shapeParams.topRadius;
    const bottomRadius = shapeParams.bottomRadius;
    const material = shapeParams.material;
    const taperedCapsuleShapeSettings =
      new this.Jolt.TaperedCapsuleShapeSettings(
        halfHeight,
        topRadius,
        bottomRadius
      );
    if (material) {
      taperedCapsuleShapeSettings.mMaterial = material;
    }
    return taperedCapsuleShapeSettings;
  }

  public getTaperedCylinderShapeSettings(
    taperedCylinderMesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): TaperedCylinderShapeSettings {
    const { shapeParams } = this.getTaperedCylinderColliderParams(
      taperedCylinderMesh,
      motionType
    );
    if (
      !shapeParams?.halfHeight ||
      !shapeParams?.topRadius ||
      !shapeParams?.bottomRadius
    ) {
      throw new Error(
        'TaperedCylinder shape params are missing halfHeight, topRadius, or bottomRadius'
      );
    }
    const halfHeight = shapeParams.halfHeight;
    const topRadius = shapeParams.topRadius;
    const bottomRadius = shapeParams.bottomRadius;
    const covexRadius = shapeParams.convexRadius ?? Config.covexRadius;
    const material = shapeParams.material;
    const taperedCylinderShapeSettings =
      new this.Jolt.TaperedCylinderShapeSettings(
        halfHeight,
        topRadius,
        bottomRadius,
        covexRadius
      );
    if (material) {
      taperedCylinderShapeSettings.mMaterial = material;
    }
    return taperedCylinderShapeSettings;
  }

  public getMeshShapeSettings(
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): MeshShapeSettings {
    const { shapeParams } = this.getMeshBodyColliderParams(mesh, motionType);
    if (
      !shapeParams?.vertices ||
      !shapeParams?.indices ||
      !shapeParams?.materials
    ) {
      throw new Error(
        'Mesh shape params are missing vertices, indices, or materials'
      );
    }
    const vertices = shapeParams.vertices;
    const indices = shapeParams.indices;
    const materials = shapeParams.materials;
    const meshShapeSettings = new this.Jolt.MeshShapeSettings(
      vertices,
      indices,
      materials
    );
    return meshShapeSettings;
  }

  //**********************************************************************************************/
  //**                              Create Body Collider Methods                                **/
  //**********************************************************************************************/

  public createBodyCollider(
    meshType: ColliderShapeType,
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    switch (meshType) {
      case 'Box':
        return this.createBoxBodyCollider(mesh, motionType);
      case 'Cylinder':
        return this.createCylinderBodyCollider(mesh, motionType);
      case 'Sphere':
        return this.createSphereBodyCollider(mesh, motionType);
      case 'Capsule':
        return this.createCapsuleBodyCollider(mesh, motionType);
      case 'TaperedCapsule':
        return this.createTaperedCapsuleBodyCollider(mesh, motionType);
      case 'TaperedCylinder':
        return this.createTaperedCylinderBodyCollider(mesh, motionType);
      case 'Mesh':
        return this.createMeshBodyCollider(mesh, motionType);
    }
  }

  public getShapeSettings(
    meshType: ColliderShapeType,
    mesh: THREE.Mesh,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): ShapeSettings {
    switch (meshType) {
      case 'Box':
        return this.getBoxShapeSettings(mesh, motionType);
      case 'Cylinder':
        return this.getCylinderShapeSettings(mesh, motionType);
      case 'Sphere':
        return this.getSphereShapeSettings(mesh, motionType);
      case 'Capsule':
        return this.getCapsuleShapeSettings(mesh, motionType);
      case 'TaperedCapsule':
        return this.getTaperedCapsuleShapeSettings(mesh, motionType);
      case 'TaperedCylinder':
        return this.getTaperedCylinderShapeSettings(mesh, motionType);
      case 'Mesh':
        return this.getMeshShapeSettings(mesh, motionType);
    }
  }

  /**
   * Append sub-shapes to a compound shape
   */
  public buildCompoundShapeSettings(
    colliderType: ColliderShapeType,
    mesh: THREE.Mesh,
    compoundShape: StaticCompoundShapeSettings,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ) {
    const shapeSettings = this.getShapeSettings(colliderType, mesh, motionType);
    const position = this.physics.unwrapVec3(mesh.position);
    const quaternion = this.physics.unwrapQuat(mesh.quaternion);
    compoundShape.AddShape(position, quaternion, shapeSettings, 0);
    this.Jolt.destroy(position);
    this.Jolt.destroy(quaternion);
    return compoundShape;
  }

  public createCompoundCollidersFromMeshes(
    colliderType: ColliderShapeType[],
    meshes: THREE.Mesh[],
    position: RVec3,
    rotation: Quat,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ): Body {
    const compoundShapeSettings = new this.Jolt.StaticCompoundShapeSettings();
    meshes.map((mesh, index) =>
      this.buildCompoundShapeSettings(
        colliderType[index],
        mesh,
        compoundShapeSettings,
        motionType
      )
    );
    const shape = compoundShapeSettings.Create().Get();
    const body = this.createBodyFromShape(shape, {
      position,
      rotation,
      motionType,
      debugParams: { color: this.getColorByMotionType(motionType) },
    });
    return body;
  }

  //************************************************************************************************/

  public createCompoundColliderFromGltf(
    gltf: GLTF,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ) {
    const names = ['Cube', 'Cylinder', 'Sphere', 'Capsule'];
    const meshes = this.getMeshesByNames(names, gltf.scene);
    const types = [
      'Box',
      'Cylinder',
      'Sphere',
      'Capsule',
    ] as ColliderShapeType[];

    const position = new this.Jolt.RVec3(5, 5, 5);
    const rotationAxis = new this.Jolt.Vec3(-1, 0, 1);
    const quaternion = this.Jolt.Quat.prototype.sRotation(
      rotationAxis,
      Math.PI / 8
    );
    const body = this.createCompoundCollidersFromMeshes(
      types,
      meshes,
      position,
      quaternion,
      motionType
    );
    this.physics.registerPhysicsBody({ body });

    // Cleanup
    this.Jolt.destroy(position);
    this.Jolt.destroy(rotationAxis);
    // Note: quaternion is a static method result, doesn't need cleanup
  }

  public createCollidersFromGltf(
    gltf: GLTF,
    motionType: EMotionType = this.Jolt.EMotionType_Dynamic
  ) {
    const names = ['Cube', 'Cylinder', 'Sphere', 'Capsule'];
    const meshes = this.getMeshesByNames(names, gltf.scene);
    const types = [
      'Box',
      'Cylinder',
      'Sphere',
      'Capsule',
    ] as ColliderShapeType[];

    meshes.map((mesh, index) =>
      this.createBodyCollider(types[index], mesh, motionType)
    );
  }
}
