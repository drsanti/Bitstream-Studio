import type {
  Body,
  PhysicsSystem,
  Vec3,
  RVec3,
  Quat,
  Shape,
} from '../jolt-loader';
import { LAYER_NON_MOVING, LAYER_MOVING } from './T3DPhysicsConfig';
import { T3DPhysicsUtils } from './T3DPhysicsUtils';
import type { BodyManagerState } from './T3DPhysicsBodyManager';
import { registerPhysicsBody } from './T3DPhysicsBodyManager';

/**
 * Interface for body factory state
 */
export interface BodyFactoryState extends BodyManagerState {
  physicsSystem: PhysicsSystem;
}

/**
 * Creates a floor (static box) at the specified size
 */
export function createFloor(state: BodyFactoryState, size: number = 50): Body {
  const Jolt = state.Jolt;

  // Step 1: Create box shape for floor
  const sizeVec = new Jolt.Vec3(size, 0.5, size);
  // Use zero convex radius for static floor to prevent object penetration
  // Convex radius is mainly useful for moving objects, not static floors
  const shape = new Jolt.BoxShape(sizeVec, 0.0);

  // Step 2: Set position and rotation
  const pos = new Jolt.RVec3(0, -2.5, 0);
  const rot = new Jolt.Quat(0, 0, 0, 1);

  // Step 3: Create body creation settings
  const creationSettings = new Jolt.BodyCreationSettings(
    shape,
    pos,
    rot,
    Jolt.EMotionType_Static,
    LAYER_NON_MOVING
  );

  // Step 4: Create the body
  const body = state.bodyInterface.CreateBody(creationSettings);

  // Step 5: Cleanup temporary objects (Vec3, RVec3, Quat are copied by constructors, safe to destroy)
  // Shape is owned by body, don't destroy
  Jolt.destroy(sizeVec);
  Jolt.destroy(pos);
  Jolt.destroy(rot);
  Jolt.destroy(creationSettings);

  // Step 6: Register body with physics system
  registerPhysicsBody(state, { body });
  return body;
}

/**
 * Creates a box physics body
 */
export function createBox(
  state: BodyFactoryState,
  position: RVec3,
  rotation: Quat,
  halfExtent: Vec3,
  motionType: number,
  layer: number
): Body {
  const Jolt = state.Jolt;

  // Step 1: Create box shape
  const shape = new Jolt.BoxShape(halfExtent, 0.05);

  // Step 2: Create body creation settings
  const creationSettings = new Jolt.BodyCreationSettings(
    shape,
    position,
    rotation,
    motionType,
    layer
  );

  // Step 3: Create the body
  const body = state.bodyInterface.CreateBody(creationSettings);

  // Step 4: Cleanup creation settings (shape is owned by body)
  Jolt.destroy(creationSettings);

  // Step 5: Register body with physics system
  registerPhysicsBody(state, { body });
  return body;
}

/**
 * Creates a sphere physics body
 */
export function createSphere(
  state: BodyFactoryState,
  position: RVec3,
  radius: number,
  motionType: number,
  layer: number
): Body {
  const Jolt = state.Jolt;

  // Step 1: Create sphere shape
  const shape = new Jolt.SphereShape(radius);

  // Step 2: Create body creation settings with identity rotation
  const creationSettings = new Jolt.BodyCreationSettings(
    shape,
    position,
    Jolt.Quat.prototype.sIdentity(),
    motionType,
    layer
  );

  // Step 3: Create the body
  const body = state.bodyInterface.CreateBody(creationSettings);

  // Step 4: Cleanup creation settings (shape is owned by body)
  Jolt.destroy(creationSettings);

  // Step 5: Register body with physics system
  registerPhysicsBody(state, { body });
  return body;
}

/**
 * Creates a mesh floor from a triangle grid
 */
export function createMeshFloor(
  state: BodyFactoryState,
  n: number,
  cellSize: number,
  _maxHeight: number,
  posX: number,
  posY: number,
  posZ: number
): void {
  const Jolt = state.Jolt;

  // Step 1: Define height function for regular grid of triangles
  const height = function (x: number, y: number) {
    return Math.sin(x / 2) * Math.cos(y / 3);
  };

  // Step 2: Create triangle list and resize for grid
  const triangles = new Jolt.TriangleList();
  triangles.resize(n * n * 2);

  // Step 3: Populate triangles with grid vertices
  for (let x = 0; x < n; ++x)
    for (let z = 0; z < n; ++z) {
      const center = (n * cellSize) / 2;

      const x1 = cellSize * x - center;
      const z1 = cellSize * z - center;
      const x2 = x1 + cellSize;
      const z2 = z1 + cellSize;

      // Step 3.1: Create first triangle of quad
      {
        const t = triangles.at((x * n + z) * 2);
        const v1 = t.get_mV(0);
        const v2 = t.get_mV(1);
        const v3 = t.get_mV(2);
        v1.x = x1;
        v1.y = height(x, z);
        v1.z = z1;
        v2.x = x1;
        v2.y = height(x, z + 1);
        v2.z = z2;
        v3.x = x2;
        v3.y = height(x + 1, z + 1);
        v3.z = z2;
      }

      // Step 3.2: Create second triangle of quad
      {
        const t = triangles.at((x * n + z) * 2 + 1);
        const v1 = t.get_mV(0);
        const v2 = t.get_mV(1);
        const v3 = t.get_mV(2);
        v1.x = x1;
        v1.y = height(x, z);
        v1.z = z1;
        v2.x = x2;
        v2.y = height(x + 1, z + 1);
        v2.z = z2;
        v3.x = x2;
        v3.y = height(x + 1, z);
        v3.z = z1;
      }
    }

  // Step 4: Create mesh shape from triangles
  const materials = new Jolt.PhysicsMaterialList();
  const shape = new Jolt.MeshShapeSettings(triangles, materials).Create().Get();

  // Step 5: Cleanup triangle list and materials (shape owns the data)
  Jolt.destroy(triangles);
  Jolt.destroy(materials);

  // Step 6: Create body with position and rotation
  const pos = new Jolt.RVec3(posX, posY, posZ);
  const rot = new Jolt.Quat(0, 0, 0, 1);
  const creationSettings = new Jolt.BodyCreationSettings(
    shape,
    pos,
    rot,
    Jolt.EMotionType_Static,
    LAYER_NON_MOVING
  );

  const body = state.bodyInterface.CreateBody(creationSettings);

  // Step 7: Cleanup temporary objects (RVec3 and Quat are copied by BodyCreationSettings, safe to destroy)
  // Shape is owned by body, don't destroy
  Jolt.destroy(pos);
  Jolt.destroy(rot);
  Jolt.destroy(creationSettings);

  // Step 8: Register body with physics system
  registerPhysicsBody(state, { body });
}

/**
 * Adds a random object to the scene
 */
export function addRandomObjectToScene(state: BodyFactoryState): void {
  // Step 1: Validate physics system is ready
  if (!state.bodyInterface || !state.physicsSystem) {
    console.warn(
      '[T3DPhysics] addRandomObjectToScene called before physics system is ready'
    );
    return;
  }

  const Jolt = state.Jolt;

  // Step 2: Define array of shape types for random generation
  const shapeTypes = [
    Jolt.EShapeSubType_Sphere,
    Jolt.EShapeSubType_Box,
    Jolt.EShapeSubType_Cylinder,
    Jolt.EShapeSubType_TaperedCylinder,
    Jolt.EShapeSubType_Capsule,
    Jolt.EShapeSubType_TaperedCapsule,
    Jolt.EShapeSubType_ConvexHull,
    Jolt.EShapeSubType_StaticCompound,
    Jolt.EShapeSubType_MutableCompound,
    Jolt.EShapeSubType_OffsetCenterOfMass,
  ];

  // Step 3: Randomly select a shape type from the array
  const shapeTypeIndex = Math.floor(Math.random() * shapeTypes.length);
  const selectedShapeType = shapeTypes[shapeTypeIndex];

  // Step 4: Create shape based on selected type
  let shape: Shape | null = null;

  switch (selectedShapeType) {
    case Jolt.EShapeSubType_Sphere: {
      // Step 4.1: Create sphere shape
      const radius = 0.5 + Math.random();
      shape = new Jolt.SphereShape(radius);
      break;
    }

    case Jolt.EShapeSubType_Box: {
      // Step 4.2: Create box shape
      const sx = 1 + Math.random();
      const sy = 1 + Math.random();
      const sz = 1 + Math.random();
      const halfExtent = new Jolt.Vec3(sx * 0.5, sy * 0.5, sz * 0.5);
      shape = new Jolt.BoxShape(halfExtent, 0.05);
      Jolt.destroy(halfExtent); // Vec3 is copied by BoxShape, safe to destroy
      break;
    }

    case Jolt.EShapeSubType_Cylinder: {
      // Step 4.3: Create cylinder shape
      const radius = 0.5 + Math.random();
      const halfHeight = 0.5 + 0.5 * Math.random();
      shape = new Jolt.CylinderShape(halfHeight, radius, 0.05);
      break;
    }

    case Jolt.EShapeSubType_TaperedCylinder: {
      // Step 4.4: Create tapered cylinder shape
      const topRadius = 0.1 + Math.random();
      const bottomRadius = 0.5 + Math.random();
      const halfHeight = 0.5 * (topRadius + bottomRadius + Math.random());
      shape = new Jolt.TaperedCylinderShapeSettings(
        halfHeight,
        topRadius,
        bottomRadius
      )
        .Create()
        .Get();
      break;
    }

    case Jolt.EShapeSubType_Capsule: {
      // Step 4.5: Create capsule shape
      const radius = 0.5 + Math.random();
      const halfHeight = 0.5 + 0.5 * Math.random();
      shape = new Jolt.CapsuleShape(halfHeight, radius);
      break;
    }

    case Jolt.EShapeSubType_TaperedCapsule: {
      // Step 4.6: Create tapered capsule shape
      const topRadius = 0.1 + Math.random();
      const bottomRadius = 0.5 + Math.random();
      const halfHeight = 0.5 * (topRadius + bottomRadius + Math.random());
      shape = new Jolt.TaperedCapsuleShapeSettings(
        halfHeight,
        topRadius,
        bottomRadius
      )
        .Create()
        .Get();
      break;
    }

    case Jolt.EShapeSubType_ConvexHull: {
      // Step 4.7: Create convex hull shape
      const hull = new Jolt.ConvexHullShapeSettings();
      const points: Vec3[] = [];

      // Step 4.7.1: Generate random points for convex hull
      for (let p = 0; p < 10; ++p) {
        const point = new Jolt.Vec3(
          -0.5 + 2 * Math.random(),
          -0.5 + 2 * Math.random(),
          -0.5 + 2 * Math.random()
        );
        points.push(point);
        hull.mPoints.push_back(point);
      }

      // Step 4.7.2: Create shape from settings
      shape = hull.Create().Get();

      // Step 4.7.3: Cleanup temporary points (Vec3 objects are copied by push_back, safe to destroy)
      for (const point of points) {
        Jolt.destroy(point);
      }
      Jolt.destroy(hull);
      break;
    }

    case Jolt.EShapeSubType_StaticCompound: {
      // Step 4.8: Create static compound shape
      const shapeSettings = new Jolt.StaticCompoundShapeSettings();
      const l = 1.0 + Math.random();
      const r2 = 0.5 + 0.5 * Math.random();
      const r1 = 0.5 * r2;

      // Step 4.8.1: Create positions and rotations for sub-shapes
      const pos1 = new Jolt.Vec3(-l, 0, 0);
      const pos2 = new Jolt.Vec3(l, 0, 0);
      const pos3 = new Jolt.Vec3(0, 0, 0);
      const rotAxis = new Jolt.Vec3(0, 0, 1);
      const rot = Jolt.Quat.prototype.sRotation(rotAxis, 0.5 * Math.PI);

      // Step 4.8.2: Add sub-shapes to compound
      shapeSettings.AddShape(
        pos1,
        Jolt.Quat.prototype.sIdentity(),
        new Jolt.SphereShapeSettings(r2),
        0
      );
      shapeSettings.AddShape(
        pos2,
        Jolt.Quat.prototype.sIdentity(),
        new Jolt.SphereShapeSettings(r2),
        0
      );
      shapeSettings.AddShape(
        pos3,
        rot,
        new Jolt.CapsuleShapeSettings(l, r1),
        0
      );

      // Step 4.8.3: Create shape from settings
      shape = shapeSettings.Create().Get();

      // Step 4.8.4: Cleanup temporary objects (Vec3 and Quat are copied by AddShape, safe to destroy)
      Jolt.destroy(pos1);
      Jolt.destroy(pos2);
      Jolt.destroy(pos3);
      Jolt.destroy(rotAxis);
      Jolt.destroy(rot);
      Jolt.destroy(shapeSettings);
      break;
    }

    case Jolt.EShapeSubType_MutableCompound: {
      // Step 4.9: Create mutable compound shape
      const shapeSettings = new Jolt.MutableCompoundShapeSettings();
      const l = 1.0 + Math.random();
      const r2 = 0.5 + 0.5 * Math.random();
      const r1 = 0.5 * r2;

      // Step 4.9.1: Create positions and rotations for sub-shapes
      const pos1 = new Jolt.Vec3(-l, 0, 0);
      const pos2 = new Jolt.Vec3(l, 0, 0);
      const pos3 = new Jolt.Vec3(0, 0, 0);
      const rotAxis = new Jolt.Vec3(0, 0, 1);
      const rot = Jolt.Quat.prototype.sRotation(rotAxis, 0.5 * Math.PI);
      const boxHalfExtent = Jolt.Vec3.prototype.sReplicate(r2);

      // Step 4.9.2: Add sub-shapes to compound
      shapeSettings.AddShape(
        pos1,
        Jolt.Quat.prototype.sIdentity(),
        new Jolt.SphereShapeSettings(r2),
        0
      );
      shapeSettings.AddShape(
        pos2,
        Jolt.Quat.prototype.sIdentity(),
        new Jolt.BoxShapeSettings(boxHalfExtent),
        0
      );
      shapeSettings.AddShape(
        pos3,
        rot,
        new Jolt.CapsuleShapeSettings(l, r1),
        0
      );

      // Step 4.9.3: Create shape from settings
      shape = shapeSettings.Create().Get();

      // Step 4.9.4: Cleanup temporary objects (Vec3 and Quat are copied by AddShape, safe to destroy)
      Jolt.destroy(pos1);
      Jolt.destroy(pos2);
      Jolt.destroy(pos3);
      Jolt.destroy(rotAxis);
      Jolt.destroy(rot);
      Jolt.destroy(boxHalfExtent);
      Jolt.destroy(shapeSettings);
      break;
    }

    case Jolt.EShapeSubType_OffsetCenterOfMass: {
      // Step 4.10: Create sphere with center of mass offset
      const radius = 0.5;
      const offset = new Jolt.Vec3(0, -0.1 * radius, 0);
      const offsetSettings = new Jolt.OffsetCenterOfMassShapeSettings(
        offset,
        new Jolt.SphereShapeSettings(radius)
      );
      shape = offsetSettings.Create().Get();

      // Step 4.10.1: Cleanup temporary objects (Vec3 is copied by OffsetCenterOfMassShapeSettings, safe to destroy)
      Jolt.destroy(offset);
      Jolt.destroy(offsetSettings);
      break;
    }
  }

  // Step 5: Validate shape was created
  if (shape === null) {
    throw new Error('Shape is null!!');
  }

  // Step 6: Position and rotate body randomly
  const pos = new Jolt.RVec3(
    (Math.random() - 0.5) * 25,
    20, // Change from 30 to 10 for shorter fall
    (Math.random() - 0.5) * 25
  );
  const rot = T3DPhysicsUtils.getRandomQuat(Jolt);

  // Step 7: Create physics body with settings
  const creationSettings = new Jolt.BodyCreationSettings(
    shape,
    pos,
    rot,
    Jolt.EMotionType_Dynamic,
    LAYER_MOVING
  );
  creationSettings.mRestitution = 0.2;
  creationSettings.mLinearDamping = 0.1; // Add air resistance (0-1)
  creationSettings.mAngularDamping = 0.2; // Add rotational damping
  const body = state.bodyInterface.CreateBody(creationSettings);

  // Step 8: Register body with physics system (shape type will be automatically determined)
  registerPhysicsBody(state, { body });

  // Step 9: Cleanup temporary objects
  // Reference ownership flow:
  // 1. shape is created (ref count = 0)
  // 2. shape passed to BodyCreationSettings -> settings takes a reference (ref count = 1, owned by settings)
  // 3. CreateBody(creationSettings) -> body takes ownership from settings (ref count = 1, now owned by body)
  // 4. creationSettings can be destroyed (no longer owns the shape)
  // 5. shape should NOT be destroyed - the body still owns it!
  //    Destroying it would leave the body with a dangling pointer, causing crashes
  // 6. shape will be auto-cleaned when body is destroyed via DestroyBody()
  //
  // Note: shape is owned by body - don't destroy it
  Jolt.destroy(creationSettings); // Settings transferred shape ownership to body, safe to destroy
  Jolt.destroy(pos);
  Jolt.destroy(rot);
}
