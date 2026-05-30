/**
 * T3DShapeCreator.ts
 *
 * April 19, 2025
 *
 * Asst.Prof.Dr.Santi Nuratch
 */

import type {
  Vec3,
  PhysicsMaterial,
  Shape,
  VertexList,
  IndexedTriangleList,
  PhysicsMaterialList,
  MutableCompoundShape,
} from '../jolt-loader';
import { T3DPhysics, JoltModule } from '../T3DPhysics';

export const Config = {
  radiusMin: 0.5,
  radiusMax: 2.0,

  halfHeightMin: 0.5,
  halfHeightMax: 2.0,

  halfExtentMin: 0.5, // Must be positive
  halfExtentMax: 2.0,

  halfDistanceMin: 0,
  halfDistanceMax: 5,

  positionMin: -20,
  positionMax: 20,

  covexRadius: 0.01,
};

export interface CreateBoxShapeParams {
  halfExtents?: Vec3;
  convexRadius?: number;
  material?: PhysicsMaterial;
}

export interface CreateSphereShapeParams {
  radius?: number;
  material?: PhysicsMaterial;
}

export interface CreateCylinderShapeParams {
  halfHeight?: number;
  radius?: number;
  convexRadius?: number;
  material?: PhysicsMaterial;
}

export interface CreateCapsuleShapeParams {
  halfHeight?: number;
  radius?: number;
  material?: PhysicsMaterial;
}

export interface CreateTaperedCapsuleShapeParams {
  halfHeight: number;
  topRadius: number;
  bottomRadius: number;
  material?: PhysicsMaterial;
}

export type CreateTaperedCylinderShapeParams = {
  halfHeight: number;
  topRadius: number;
  bottomRadius: number;
  convexRadius?: number;
  material?: PhysicsMaterial;
};

export interface CreateConvexHullShapeParams {
  points?: Vec3[];
  material?: PhysicsMaterial;
}

export type CreateMeshShapeParams = {
  vertices: VertexList;
  indices: IndexedTriangleList;
  materials: PhysicsMaterialList;
};

export type CreateStaticCompoundCapsuleSphereShapesParams = {
  cylinderHalfLength?: number;
  cylinderRadius?: number;
  sphereRadius?: number;
  boxHalfExtent?: Vec3;
  material?: PhysicsMaterial;
};

export type CreateMutableCompoundCapsuleSphereShapesParams = {
  capsuleHalfLength?: number;
  capsuleRadius?: number;
  sphereRadius?: number;
  boxHalfExtent?: Vec3;
  material?: PhysicsMaterial;
};

/**
 *
 */
export class T3DShapeCreator {
  public physics: T3DPhysics;
  protected get Jolt(): JoltModule {
    return this.physics.jolt;
  }

  constructor(physics: T3DPhysics) {
    this.physics = physics;
  }

  public randomRadius(): number {
    return this.physics.randomScalar(Config.radiusMin, Config.radiusMax);
  }

  public randomHalfHeight(): number {
    return this.physics.randomScalar(
      Config.halfHeightMin,
      Config.halfHeightMax
    );
  }

  public randomHalfExtent(): Vec3 {
    return this.physics.randomVec3(Config.halfExtentMin, Config.halfExtentMax);
  }

  public randomHalfDistance(): Vec3 {
    return this.physics.randomVec3(
      Config.halfDistanceMin,
      Config.halfDistanceMax
    );
  }

  public createBoxShape(params?: CreateBoxShapeParams): Shape {
    const {
      halfExtents: halfExtent = this.randomHalfExtent(),
      convexRadius = Config.covexRadius,
      // material is not used - materials are typically set on BodyCreationSettings, not on shape constructors
    } = params || {};

    const shape = new this.Jolt.BoxShape(halfExtent, convexRadius);

    this.Jolt.destroy(halfExtent);

    return shape;
  }

  public createSphereShape(params?: CreateSphereShapeParams): Shape {
    const {
      radius = this.randomRadius(),
      // material is not used - materials are typically set on BodyCreationSettings, not on shape constructors
    } = params || {};

    const shape = new this.Jolt.SphereShape(radius);
    return shape;
  }

  public createCapsuleShape(params?: CreateCapsuleShapeParams): Shape {
    const {
      halfHeight = this.randomHalfHeight(),
      radius = this.randomRadius(),
      // material is not used - materials are typically set on BodyCreationSettings, not on shape constructors
    } = params || {};

    const shape = new this.Jolt.CapsuleShape(halfHeight, radius);
    return shape;
  }

  public createCylinderShape(
    params?: CreateCylinderShapeParams
  ): Shape {
    const {
      halfHeight = this.randomHalfHeight(),
      radius = this.randomRadius(),
      convexRadius = Config.covexRadius,
      // material is not used - materials are typically set on BodyCreationSettings, not on shape constructors
    } = params || {};

    const shape = new this.Jolt.CylinderShape(halfHeight, radius, convexRadius);
    return shape;
  }

  public createConvexHullShape(
    params?: CreateConvexHullShapeParams
  ): Shape {
    const { points, material } = params || {};

    // Step 1: Create convex hull shape settings object
    const hull = new this.Jolt.ConvexHullShapeSettings();

    const tempPoints: Vec3[] = [];

    // Step 2: Prepare points for convex hull
    if (points && points.length > 0) {
      // Step 2.1: Use provided points
      tempPoints.push(...points);

      // Step 2.2: Destroy original point objects (they will be copied)
      for (const point of points) {
        this.Jolt.destroy(point);
      }
    } else {
      // Step 2.3: Generate random points if none provided
      for (let p = 0; p < 8; ++p) {
        tempPoints.push(this.randomHalfDistance());
      }
    }

    // Step 3: Add points to hull settings
    for (let i = 0; i < tempPoints.length; ++i) {
      hull.mPoints.push_back(tempPoints[i]);
    }

    // Step 4: Assign material if provided
    if (material) {
      hull.mMaterial = material;
    }

    // Step 5: Create the convex hull shape from settings
    const shape = hull.Create().Get();

    // Step 6: Clean up temporary point objects (they are copied by push_back)
    for (const point of tempPoints) {
      this.Jolt.destroy(point);
    }

    // Step 7: Return the created convex hull shape
    return shape;
  }

  public createTaperedCapsuleShape(
    params?: CreateTaperedCapsuleShapeParams
  ): Shape {
    const {
      halfHeight = this.randomHalfHeight(),
      topRadius = this.randomRadius(),
      bottomRadius = this.randomRadius(),
      material,
    } = params || {};

    // 🏗️ Create a new tapered capsule shape settings object with the specified dimensions and material
    const settings = new this.Jolt.TaperedCapsuleShapeSettings(
      halfHeight,
      topRadius,
      bottomRadius
    );
    if (material) {
      settings.mMaterial = material;
    }
    const shape = settings.Create().Get();

    // 🔄 Return the created tapered capsule shape
    return shape;
  }

  public createTaperedCylinderShape(
    params?: CreateTaperedCylinderShapeParams
  ): Shape {
    const {
      halfHeight = this.randomHalfHeight(),
      topRadius = this.randomRadius(),
      bottomRadius = this.randomRadius(),
      convexRadius = Config.covexRadius,
      material,
    } = params || {};

    // 🏗️ Create a new tapered cylinder shape settings object with the specified dimensions and material
    const settings = new this.Jolt.TaperedCylinderShapeSettings(
      halfHeight,
      topRadius,
      bottomRadius,
      convexRadius
    );
    if (material) {
      settings.mMaterial = material;
    }
    const shape = settings.Create().Get();
    return shape;
  }

  public createMeshShape(params?: CreateMeshShapeParams): Shape {
    const { vertices, indices, materials: materials } = params || {};
    if (!vertices || !indices || !materials) {
      throw new Error('Invalid mesh shape parameters.');
    }

    const shapeSettings = new this.Jolt.MeshShapeSettings(
      vertices,
      indices,
      materials
    ).Create();
    const shape = shapeSettings.Get();

    this.Jolt.destroy(vertices);
    this.Jolt.destroy(indices);
    this.Jolt.destroy(shapeSettings);

    return shape;
  }

  public createStaticCompoundShape(
    params?: CreateStaticCompoundCapsuleSphereShapesParams
  ): Shape {
    /**
     * +--------+                +--------+
     * |        +----------------+        |
     * |  HEAD  |      BODY      |  TAIL  |
     * |        +----------------+        |
     * +--------+                +--------+
     *   Sphere     Cylinder         Box
     *
     * 📝 The Body (Cylinder) will be rotated 90 degrees along the z-axis to align horizontally,
     *    creating a compound shape that resembles a head-body-tail structure.
     */

    // Step 1: Extract parameters with defaults
    const _length = this.randomHalfHeight();
    const {
      cylinderHalfLength = _length,
      cylinderRadius = (_length * (1 + Math.random())) / 4,
      sphereRadius = this.randomRadius(),
      boxHalfExtent = this.randomHalfExtent(),
      material,
    } = params || {};

    // Step 2: Create shape settings for each sub-shape
    // Step 2.1: Create cylinder (Body) shape settings
    const cylinderShapeSettings = new this.Jolt.CylinderShapeSettings(
      cylinderHalfLength,
      cylinderRadius,
      Config.covexRadius
    );
    if (material) {
      cylinderShapeSettings.mMaterial = material;
    }

    // Step 2.2: Create sphere (Head) shape settings
    const sphereShapeSettings = new this.Jolt.SphereShapeSettings(sphereRadius);
    if (material) {
      sphereShapeSettings.mMaterial = material;
    }

    // Step 2.3: Create box (Tail) shape settings
    const boxShapeSettings = new this.Jolt.BoxShapeSettings(
      boxHalfExtent,
      Config.covexRadius
    );
    if (material) {
      boxShapeSettings.mMaterial = material;
    }

    // Step 3: Define positions for each sub-shape
    // Step 3.1: Cylinder (Body) position at center
    const cylinderPosition = new this.Jolt.Vec3(0, 0, 0);

    // Step 3.2: Sphere (Head) position to the left
    const spherePosition = new this.Jolt.Vec3(
      -(cylinderHalfLength + sphereRadius),
      0,
      0
    );

    // Step 3.3: Box (Tail) position to the right
    const boxPosition = new this.Jolt.Vec3(
      cylinderHalfLength + boxHalfExtent.GetX(),
      0,
      0
    );

    // Step 4: Define rotations for each sub-shape
    // Step 4.1: Cylinder rotation (90 degrees along z-axis to align horizontally)
    const cylinderRotationAxis = new this.Jolt.Vec3(0, 0, 1);
    const cylinderQuaternion = this.Jolt.Quat.prototype.sRotation(
      cylinderRotationAxis,
      0.5 * Math.PI
    );

    // Step 4.2: No rotation for head and tail
    const noRotation = this.Jolt.Quat.prototype.sIdentity();

    // Step 5: Create static compound shape settings
    const compoundShapeSettings = new this.Jolt.StaticCompoundShapeSettings();

    // Step 6: Add sub-shapes to compound shape
    // Step 6.1: Add sphere (Head) shape
    compoundShapeSettings.AddShape(
      spherePosition,
      noRotation,
      sphereShapeSettings,
      0
    );

    // Step 6.2: Add box (Tail) shape
    compoundShapeSettings.AddShape(
      boxPosition,
      noRotation,
      boxShapeSettings,
      0
    );

    // Step 6.3: Add cylinder (Body) shape
    compoundShapeSettings.AddShape(
      cylinderPosition,
      cylinderQuaternion,
      cylinderShapeSettings,
      0
    );

    // Step 7: Create the compound shape from settings
    const shape = compoundShapeSettings.Create().Get();

    // Step 8: Cleanup temporary objects
    this.Jolt.destroy(boxHalfExtent);
    this.Jolt.destroy(spherePosition);
    this.Jolt.destroy(boxPosition);
    this.Jolt.destroy(cylinderPosition);
    this.Jolt.destroy(sphereShapeSettings);
    this.Jolt.destroy(boxShapeSettings);
    this.Jolt.destroy(cylinderShapeSettings);
    this.Jolt.destroy(cylinderRotationAxis);
    this.Jolt.destroy(cylinderQuaternion);
    // Note: Don't destroy compoundShapeSettings here - it's owned by the shape

    return shape;
  }

  public createMutableCompoundShape(
    params?: CreateMutableCompoundCapsuleSphereShapesParams
  ): MutableCompoundShape {
    // Step 1: Extract parameters with defaults
    const _length = this.randomHalfHeight();
    const {
      capsuleHalfLength = _length,
      capsuleRadius = (_length * (1 + Math.random())) / 4,
      sphereRadius = this.randomRadius(),
      boxHalfExtent = this.randomHalfExtent(),
      material,
    } = params || {};

    // Step 2: Create mutable compound shape settings
    const compoundShapeSettings = new this.Jolt.MutableCompoundShapeSettings();

    // Step 3: Create shape settings for each sub-shape
    // Step 3.1: Create capsule (Body) shape settings
    const capsuleShapeSettings = new this.Jolt.CapsuleShapeSettings(
      capsuleHalfLength,
      capsuleRadius
    );
    if (material) {
      capsuleShapeSettings.mMaterial = material;
    }

    // Step 3.2: Create sphere (Head) shape settings
    const sphereShapeSettings = new this.Jolt.SphereShapeSettings(sphereRadius);
    if (material) {
      sphereShapeSettings.mMaterial = material;
    }

    // Step 3.3: Create box (Tail) shape settings
    const boxShapeSettings = new this.Jolt.BoxShapeSettings(
      boxHalfExtent,
      Config.covexRadius
    );
    if (material) {
      boxShapeSettings.mMaterial = material;
    }

    // Step 4: Define positions for each sub-shape
    // Step 4.1: Capsule (Body) position at center
    const capsulePosition = new this.Jolt.Vec3(0, 0, 0);

    // Step 4.2: Sphere (Head) position to the left
    const spherePosition = new this.Jolt.Vec3(
      -(capsuleHalfLength + sphereRadius + capsuleRadius),
      0,
      0
    );

    // Step 4.3: Box (Tail) position to the right
    const boxPosition = new this.Jolt.Vec3(
      capsuleHalfLength + boxHalfExtent.GetX() + capsuleRadius,
      0,
      0
    );

    // Step 5: Define rotations for each sub-shape
    // Step 5.1: Capsule rotation (90 degrees along z-axis to align horizontally)
    const cylinderRotationAxis = new this.Jolt.Vec3(0, 0, 1);
    const cylinderQuaternion = this.Jolt.Quat.prototype.sRotation(
      cylinderRotationAxis,
      0.5 * Math.PI
    );

    // Step 5.2: No rotation for head and tail
    const noRotation = this.Jolt.Quat.prototype.sIdentity();

    // Step 6: Add sub-shapes to compound shape
    // Step 6.1: Add sphere (Head) shape
    compoundShapeSettings.AddShape(
      spherePosition,
      noRotation,
      sphereShapeSettings,
      0
    );

    // Step 6.2: Add box (Tail) shape
    compoundShapeSettings.AddShape(
      boxPosition,
      noRotation,
      boxShapeSettings,
      0
    );

    // Step 6.3: Add capsule (Body) shape
    compoundShapeSettings.AddShape(
      capsulePosition,
      cylinderQuaternion,
      capsuleShapeSettings,
      0
    );

    // Step 7: Create the compound shape from settings
    const shape = compoundShapeSettings.Create().Get();

    // Step 8: Cast to mutable compound shape (KEY STEP)
    const mutableShape = this.Jolt.castObject(
      shape,
      this.Jolt.MutableCompoundShape
    );

    // Step 9: Cleanup temporary objects
    this.Jolt.destroy(boxHalfExtent);
    this.Jolt.destroy(spherePosition);
    this.Jolt.destroy(boxPosition);
    this.Jolt.destroy(capsulePosition);
    this.Jolt.destroy(sphereShapeSettings);
    this.Jolt.destroy(boxShapeSettings);
    this.Jolt.destroy(capsuleShapeSettings);
    this.Jolt.destroy(cylinderRotationAxis);
    this.Jolt.destroy(cylinderQuaternion);

    return mutableShape;
  }

  /*
  public createBodyFromShape(shape: Shape) {
    const pos = this.physics.randomRVec3(-20, 20);
    pos.SetY(20 + Math.random() * 20);

    const rot = this.physics.randomQuat();

    const creationSettings: BodyCreationSettings = new Jolt.BodyCreationSettings(shape, pos, rot, Jolt.EMotionType_Dynamic, LAYER_MOVING);

    creationSettings.mRestitution = 0.5;
    const body: Body = this.physics.bodyInterface.CreateBody(creationSettings);

    // Color is now automatically determined from shape type
    this.physics.registerPhysicsBody({ body });

    Jolt.destroy(pos);
    Jolt.destroy(rot);
    Jolt.destroy(creationSettings);
  }
  */
}
