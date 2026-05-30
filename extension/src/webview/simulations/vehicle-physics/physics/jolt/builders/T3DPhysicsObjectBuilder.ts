import { VehiclePhysicsHost } from '@vehicle-host';
import * as THREE from 'three';
import { LAYER_MOVING, T3DPhysics } from '../T3DPhysics';
import type {
  EMotionType,
  BodyID,
  Body,
  ConvexHullShapeSettings,
  Vec3,
  Shape,
} from '../jolt-loader';
import { T3DColliderCreator } from './T3DColliderCreator';
import { T3DModelToCollider, T3DMeshToConvexHull } from '../converters';

/**
 * Options for T3DPhysicsObjectBuilder
 */
export interface T3DPhysicsObjectBuilderOptions {
  motionType?: EMotionType;
  enableSync?: boolean; // Default: true
  enableVerification?: boolean; // Default: true
  createTestSphere?: boolean; // Default: true
  createGroundPlane?: boolean; // Default: true
}

/**
 * Mappings interface for accessing body-to-visual-object mappings
 */
export interface T3DPhysicsObjectBuilderMappings {
  bodyToGroupMap: Map<BodyID, THREE.Group>;
  bodyToMeshMap: Map<BodyID, THREE.Mesh>;
  bodyToCSMMap: Map<BodyID, THREE.Object3D>;
}

/**
 * T3DPhysicsObjectBuilder
 *
 * Utility class for building physics objects from 3D models (GLB/GLTF).
 * Handles extraction of SMO (Single Material Object), MMO (Multi Material Object),
 * and CSM (Compound Shape Mesh) objects, creates appropriate physics colliders,
 * and manages synchronization between visual objects and physics bodies.
 *
 * Integrates with T3DPhysics's existing dynamicObjects array and registerPhysicsBody() infrastructure.
 */
export class T3DPhysicsObjectBuilder {
  private physics: T3DPhysics;
  private engine: VehiclePhysicsHost;
  private colliderCreator: T3DColliderCreator;
  private modelToCollider: T3DModelToCollider;
  private meshToConvexHull: T3DMeshToConvexHull;
  private bodyToGroupMap: Map<BodyID, THREE.Group> = new Map();
  private bodyToMeshMap: Map<BodyID, THREE.Mesh> = new Map();
  private bodyToCSMMap: Map<BodyID, THREE.Object3D> = new Map();
  private syncCleanupCallback: (() => void) | null = null;

  constructor(physics: T3DPhysics, engine: VehiclePhysicsHost) {
    this.physics = physics;
    this.engine = engine;
    this.colliderCreator = new T3DColliderCreator(physics);
    this.modelToCollider = new T3DModelToCollider(physics);
    this.meshToConvexHull = new T3DMeshToConvexHull(physics);
  }

  /**
   * Get SMO (Single Material Object) objects from the model
   * SMO objects are individual meshes with a single material
   */
  public static getSMOObjects(model: THREE.Group): THREE.Mesh[] {
    const smoObjects: THREE.Mesh[] = [];
    const processedGroups = new Set<THREE.Group>();

    // First, identify groups that contain only meshes (MMO objects)
    model.traverse((object) => {
      if (object instanceof THREE.Group && object.children.length > 0) {
        const allMeshes = object.children.every(
          (child) => child instanceof THREE.Mesh
        );
        if (allMeshes) {
          processedGroups.add(object);
        }
      }
    });

    // Then, find individual meshes that are NOT children of MMO groups
    model.traverse((object) => {
      if (object !== model && object instanceof THREE.Mesh) {
        // Check if this mesh is a child of a processed group (MMO)
        const parent = object.parent;
        if (parent && processedGroups.has(parent as THREE.Group)) {
          // This mesh is part of an MMO group, skip it
          return;
        }

        // Check if material is single (either not an array, or array with length === 1)
        const isSingleMaterial = Array.isArray(object.material)
          ? object.material.length === 1
          : true; // Single material object (not an array)

        if (isSingleMaterial) {
          smoObjects.push(object);
        }
      }
    });

    return smoObjects;
  }

  /**
   * Get MMO (Multi Material Object) objects from the model
   * MMO objects are Groups that contain only Mesh children
   */
  public static getMMOObjects(model: THREE.Group): THREE.Group[] {
    const mmoObjects: THREE.Group[] = [];
    model.traverse((object) => {
      if (
        object !== model &&
        object instanceof THREE.Group &&
        object.children.length > 0
      ) {
        // Check if all children are meshes
        const allMeshes = object.children.every(
          (child) => child instanceof THREE.Mesh
        );
        if (allMeshes) {
          mmoObjects.push(object);
        }
      }
    });
    return mmoObjects;
  }

  /**
   * Get CSM (Compound Shape Mesh) objects from the model
   * CSM objects are Object3D/Group containers that have SMO and/or MMO objects as children
   */
  public static getCSMObjects(
    model: THREE.Group,
    smoObjects: THREE.Mesh[],
    mmoObjects: THREE.Group[]
  ): THREE.Object3D[] {
    const csmObjects: THREE.Object3D[] = [];
    const smoSet = new Set(smoObjects);
    const mmoSet = new Set(mmoObjects);

    // Traverse model to find Object3D/Group objects that have SMO or MMO children
    model.traverse((object) => {
      if (object === model) {
        return; // Skip root
      }

      // Check if this is an Object3D or Group (not a Mesh)
      if (!(object instanceof THREE.Mesh)) {
        // Check if it has children that are SMO or MMO objects
        let hasSMOOrMMOChild = false;

        // Check direct children
        for (const child of object.children) {
          // Check if child is an SMO object
          if (child instanceof THREE.Mesh && smoSet.has(child)) {
            hasSMOOrMMOChild = true;
            break;
          }
          // Check if child is an MMO object
          if (child instanceof THREE.Group && mmoSet.has(child)) {
            hasSMOOrMMOChild = true;
            break;
          }
        }

        // Only add if it has SMO/MMO children and is not itself an MMO object
        if (hasSMOOrMMOChild && !mmoSet.has(object as THREE.Group)) {
          csmObjects.push(object);
        }
      }
    });

    return csmObjects;
  }

  /**
   * Create convex hull shape settings from an SMO mesh
   * This is used for building compound shapes without creating temporary bodies
   */
  private createConvexHullShapeSettingsFromMesh(
    mesh: THREE.Mesh
  ): ConvexHullShapeSettings | null {
    const Jolt = this.physics.jolt;

    try {
      // Clone geometry - extract vertices directly without applying mesh transform
      // Position and rotation are handled by AddShape when adding to compound
      // This matches the approach in T3DModelToCollider.createCompoundBodyFromGroup
      const cloned = mesh.geometry.clone().toNonIndexed();
      const posAttr = cloned.attributes.position;
      const vertexCount = posAttr.count;

      if (vertexCount === 0) {
        cloned.dispose();
        return null;
      }

      const vertices: Vec3[] = [];
      let hasValidVertices = false;

      for (let i = 0; i < vertexCount; ++i) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        // Validate vertex coordinates
        if (
          !isFinite(x) ||
          !isFinite(y) ||
          !isFinite(z) ||
          Math.abs(x) > 1e6 ||
          Math.abs(y) > 1e6 ||
          Math.abs(z) > 1e6
        ) {
          continue;
        }

        const v = new Jolt.Vec3(x, y, z);
        vertices.push(v);
        hasValidVertices = true;
      }

      cloned.dispose();

      if (!hasValidVertices || vertices.length < 4) {
        // Cleanup vertices
        for (const v of vertices) {
          Jolt.destroy(v);
        }
        return null;
      }

      // Create convex hull shape settings
      const hullSettings = new Jolt.ConvexHullShapeSettings();
      for (const v of vertices) {
        hullSettings.mPoints.push_back(v);
      }

      // Cleanup vertices (they are copied by push_back)
      for (const v of vertices) {
        Jolt.destroy(v);
      }

      return hullSettings;
    } catch (error) {
      console.warn(
        `Failed to create convex hull shape settings from mesh "${mesh.name || 'Unnamed'}":`,
        error
      );
      return null;
    }
  }

  /**
   * Create convex hull shape settings from an MMO group
   * This merges all child meshes and creates a single convex hull
   */
  private createConvexHullShapeSettingsFromGroup(
    group: THREE.Group
  ): ConvexHullShapeSettings | null {
    const Jolt = this.physics.jolt;

    try {
      // Merge group meshes into a single geometry
      const merged = this.modelToCollider.mergeGroupMeshes(group);
      if (!merged || !merged.tempMesh) {
        return null;
      }

      const mesh = merged.tempMesh;
      const cloned = mesh.geometry.clone().toNonIndexed();
      const posAttr = cloned.attributes.position;
      const vertexCount = posAttr.count;

      if (vertexCount === 0) {
        cloned.dispose();
        return null;
      }

      const vertices: Vec3[] = [];
      let hasValidVertices = false;

      for (let i = 0; i < vertexCount; ++i) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        // Validate vertex coordinates
        if (
          !isFinite(x) ||
          !isFinite(y) ||
          !isFinite(z) ||
          Math.abs(x) > 1e6 ||
          Math.abs(y) > 1e6 ||
          Math.abs(z) > 1e6
        ) {
          continue;
        }

        const v = new Jolt.Vec3(x, y, z);
        vertices.push(v);
        hasValidVertices = true;
      }

      cloned.dispose();

      if (!hasValidVertices || vertices.length < 4) {
        // Cleanup vertices
        for (const v of vertices) {
          Jolt.destroy(v);
        }
        return null;
      }

      // Create convex hull shape settings
      const hullSettings = new Jolt.ConvexHullShapeSettings();
      for (const v of vertices) {
        hullSettings.mPoints.push_back(v);
      }

      // Cleanup vertices (they are copied by push_back)
      for (const v of vertices) {
        Jolt.destroy(v);
      }

      return hullSettings;
    } catch (error) {
      console.warn(
        `Failed to create convex hull shape settings from group "${group.name || 'Unnamed'}":`,
        error
      );
      return null;
    }
  }

  /**
   * Create convex hull collider from a mesh
   */
  private createConvexHullColliderFromMesh(
    mesh: THREE.Mesh,
    motionType: EMotionType
  ): { body: Body; bodyId: BodyID } | null {
    const Jolt = this.physics.jolt;

    try {
      let body: Body | null = null;
      let bodyId: BodyID | null = null;

      if (motionType === Jolt.EMotionType_Static) {
        // Use mesh collider for static (more accurate)
        body = this.colliderCreator.createMeshBodyCollider(
          mesh,
          Jolt.EMotionType_Static
        );
        if (body) {
          bodyId = body.GetID();
          // Register body with visual group
          this.physics.registerPhysicsBody({ body, visualGroup: mesh });
          console.log(
            `✅ Physics body created (Mesh) for "${mesh.name || 'Unnamed'}": ID=${bodyId}, MotionType=Static`
          );
        }
      } else {
        // Use convex hull for dynamic/kinematic
        body = this.meshToConvexHull.createConvexHullBodyFromMesh(
          mesh,
          motionType,
          mesh // Pass the mesh as visual group for synchronization
        );
        if (body) {
          bodyId = body.GetID();
          // Register body with visual group
          this.physics.registerPhysicsBody({ body, visualGroup: mesh });
          const motionTypeStr =
            motionType === Jolt.EMotionType_Dynamic
              ? 'Dynamic'
              : motionType === Jolt.EMotionType_Kinematic
                ? 'Kinematic'
                : 'Other';
          console.log(
            `✅ Physics body created (ConvexHull) for "${mesh.name || 'Unnamed'}": ID=${bodyId}, MotionType=${motionTypeStr}`
          );
        }
      }

      if (!body || bodyId === null) {
        console.warn(
          `Failed to create physics body for mesh "${mesh.name || 'Unnamed'}"`
        );
        return null;
      }

      // At this point, bodyId is guaranteed to be non-null
      const verifiedBodyId = bodyId;

      // Verify and activate body if needed
      const bodyInterface = this.physics.getBodyInterface();
      const isBodyValid = bodyInterface.IsAdded(verifiedBodyId);

      // Ensure body is activated if it's dynamic
      if (motionType === Jolt.EMotionType_Dynamic && isBodyValid) {
        // Check if body is active
        const isActive = bodyInterface.IsActive(verifiedBodyId);
        if (!isActive) {
          console.log(
            `  └─ Activating body ${verifiedBodyId.GetIndexAndSequenceNumber()}...`
          );
          bodyInterface.ActivateBody(verifiedBodyId);
        }

        // Verify motion type
        const actualMotionType = body.GetMotionType();
        const motionTypeStr =
          actualMotionType === Jolt.EMotionType_Dynamic
            ? '✅ Dynamic'
            : actualMotionType === Jolt.EMotionType_Static
              ? '⚠️ Static'
              : actualMotionType === Jolt.EMotionType_Kinematic
                ? '⚠️ Kinematic'
                : '⚠️ Other';
        console.log(`  └─ Motion Type: ${motionTypeStr}`);

        // Log body position to verify it's not at ground level
        const bodyPos = this.physics.wrapVec3(body.GetPosition());
        console.log(
          `  └─ Body Position: (${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(2)}, ${bodyPos.z.toFixed(2)})`
        );

        // If body is at or below y=0, lift it up slightly to ensure it falls
        if (bodyPos.y <= 0.1) {
          const liftPos = new Jolt.RVec3(bodyPos.x, bodyPos.y + 1.0, bodyPos.z);
          bodyInterface.SetPosition(
            verifiedBodyId,
            liftPos,
            Jolt.EActivation_Activate
          );
          Jolt.destroy(liftPos);
          console.log(`  └─ Lifted body up by 1.0 units to ensure it falls`);
        }
      }

      console.log(
        `  └─ Registration: ${isBodyValid ? '✅ Registered' : '❌ Not registered'}`
      );

      // Verify body is in dynamicObjects array
      const dynamicObjects = this.physics.getDynamicObjects();
      const foundInArray = dynamicObjects.some((obj) => {
        const objId = obj.body.GetID();
        return (
          objId.GetIndexAndSequenceNumber() ===
          verifiedBodyId.GetIndexAndSequenceNumber()
        );
      });
      console.log(
        `  └─ In dynamicObjects: ${foundInArray ? '✅ Yes' : '❌ No'}`
      );

      // Verify debug mesh was created
      const bodyObj = dynamicObjects.find((obj) => {
        const objId = obj.body.GetID();
        return (
          objId.GetIndexAndSequenceNumber() ===
          verifiedBodyId.GetIndexAndSequenceNumber()
        );
      });
      if (bodyObj) {
        const hasDebugMesh = !!bodyObj.debugMesh;
        const debugMeshInScene = bodyObj.debugMesh
          ? this.engine.getScene().children.includes(bodyObj.debugMesh)
          : false;
        console.log(
          `  └─ Debug mesh: ${hasDebugMesh ? '✅ Created' : '❌ Missing'}, In scene: ${debugMeshInScene ? '✅ Yes' : '❌ No'}`
        );
        if (bodyObj.debugMesh) {
          const pos = new THREE.Vector3();
          bodyObj.debugMesh.getWorldPosition(pos);
          console.log(
            `  └─ Debug mesh position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`
          );
        }
      }

      return { body, bodyId: verifiedBodyId };
    } catch (error) {
      console.warn(
        `Failed to create physics body for mesh "${mesh.name || 'Unnamed'}":`,
        error
      );
      return null;
    }
  }

  /**
   * Create convex hull collider from a group
   */
  private createConvexHullColliderFromGroup(
    group: THREE.Group,
    motionType: EMotionType
  ): { body: Body; bodyId: BodyID } | null {
    const Jolt = this.physics.jolt;

    try {
      // Collect all child meshes
      const childMeshes: THREE.Mesh[] = [];
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          childMeshes.push(child);
        }
      });

      if (childMeshes.length === 0) {
        return null;
      }

      // Combine all child meshes into a single geometry
      const geometries: THREE.BufferGeometry[] = [];

      childMeshes.forEach((mesh) => {
        // Clone geometry and apply child's local transform (relative to Group)
        const geometry = mesh.geometry.clone();
        // Apply the mesh's local matrix (not world) to bake in child's transform
        geometry.applyMatrix4(mesh.matrix);
        geometries.push(geometry);
      });

      let body: Body | null = null;
      let bodyId: BodyID | null = null;

      if (motionType === Jolt.EMotionType_Static) {
        // Use mesh collider for static (more accurate)
        const merged = this.modelToCollider.mergeGroupMeshes(group);
        if (merged) {
          body = this.colliderCreator.createMeshBodyCollider(
            merged.tempMesh,
            Jolt.EMotionType_Static
          );
          bodyId = body.GetID();
          // Register body with visual group
          this.physics.registerPhysicsBody({ body, visualGroup: group });
          console.log(
            `✅ Physics body created (Mesh) for "${group.name}": ID=${bodyId}, MotionType=Static`
          );
        }
      } else {
        // Use compound shape for dynamic (more accurate than single convex hull)
        // Alternative: use createConvexHullBodyFromGroup for simpler/faster approach
        body = this.modelToCollider.createCompoundBodyFromGroup(
          group,
          motionType
        );
        if (body) {
          bodyId = body.GetID();
          // Register body with visual group
          this.physics.registerPhysicsBody({ body, visualGroup: group });
          console.log(
            `✅ Physics body created (Compound) for "${group.name}": ID=${bodyId}, MotionType=Dynamic`
          );
        } else {
          // Fallback to convex hull if compound fails
          body = this.modelToCollider.createConvexHullBodyFromGroup(
            group,
            motionType
          );
          if (body) {
            bodyId = body.GetID();
            // Register body with visual group
            this.physics.registerPhysicsBody({ body, visualGroup: group });
            console.log(
              `✅ Physics body created (ConvexHull) for "${group.name}": ID=${bodyId}, MotionType=Dynamic`
            );
          }
        }
      }

      if (!body || bodyId === null) {
        console.warn(`Failed to create physics body for group "${group.name}"`);
        // Cleanup geometries
        geometries.forEach((geo) => geo.dispose());
        return null;
      }

      // At this point, bodyId is guaranteed to be non-null
      const verifiedBodyId = bodyId;

      // Verify and activate body if needed
      const bodyInterface = this.physics.getBodyInterface();
      const isBodyValid = bodyInterface.IsAdded(verifiedBodyId);

      // Ensure body is activated if it's dynamic
      if (motionType === Jolt.EMotionType_Dynamic && isBodyValid) {
        // Check if body is active
        const isActive = bodyInterface.IsActive(verifiedBodyId);
        if (!isActive) {
          console.log(
            `  └─ Activating body ${verifiedBodyId.GetIndexAndSequenceNumber()}...`
          );
          bodyInterface.ActivateBody(verifiedBodyId);
        }

        // Verify motion type
        const actualMotionType = body.GetMotionType();
        const motionTypeStr =
          actualMotionType === Jolt.EMotionType_Dynamic
            ? '✅ Dynamic'
            : actualMotionType === Jolt.EMotionType_Static
              ? '⚠️ Static'
              : actualMotionType === Jolt.EMotionType_Kinematic
                ? '⚠️ Kinematic'
                : '⚠️ Other';
        console.log(`  └─ Motion Type: ${motionTypeStr}`);

        // Log body position to verify it's not at ground level
        const bodyPos = this.physics.wrapVec3(body.GetPosition());
        console.log(
          `  └─ Body Position: (${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(2)}, ${bodyPos.z.toFixed(2)})`
        );

        // If body is at or below y=0, lift it up slightly to ensure it falls
        if (bodyPos.y <= 0.1) {
          const liftPos = new Jolt.RVec3(bodyPos.x, bodyPos.y + 1.0, bodyPos.z);
          bodyInterface.SetPosition(
            verifiedBodyId,
            liftPos,
            Jolt.EActivation_Activate
          );
          Jolt.destroy(liftPos);
          console.log(`  └─ Lifted body up by 1.0 units to ensure it falls`);
        }
      }

      console.log(
        `  └─ Registration: ${isBodyValid ? '✅ Registered' : '❌ Not registered'}`
      );

      // Verify body is in dynamicObjects array
      const dynamicObjects = this.physics.getDynamicObjects();
      const foundInArray = dynamicObjects.some((obj) => {
        const objId = obj.body.GetID();
        return (
          objId.GetIndexAndSequenceNumber() ===
          verifiedBodyId.GetIndexAndSequenceNumber()
        );
      });
      console.log(
        `  └─ In dynamicObjects: ${foundInArray ? '✅ Yes' : '❌ No'}`
      );

      // Verify debug mesh was created
      const bodyObj = dynamicObjects.find((obj) => {
        const objId = obj.body.GetID();
        return (
          objId.GetIndexAndSequenceNumber() ===
          verifiedBodyId.GetIndexAndSequenceNumber()
        );
      });
      if (bodyObj) {
        const hasDebugMesh = !!bodyObj.debugMesh;
        const debugMeshInScene = bodyObj.debugMesh
          ? this.engine.getScene().children.includes(bodyObj.debugMesh)
          : false;
        console.log(
          `  └─ Debug mesh: ${hasDebugMesh ? '✅ Created' : '❌ Missing'}, In scene: ${debugMeshInScene ? '✅ Yes' : '❌ No'}`
        );
        if (bodyObj.debugMesh) {
          const pos = new THREE.Vector3();
          bodyObj.debugMesh.getWorldPosition(pos);
          console.log(
            `  └─ Debug mesh position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`
          );
        }
      }

      // Don't dispose mergedGeometry - it's being used by tempMesh
      // Only dispose the source geometries
      geometries.forEach((geo) => geo.dispose());

      return { body, bodyId: verifiedBodyId };
    } catch (error) {
      console.warn(
        `Failed to create physics body for group "${group.name}":`,
        error
      );
      return null;
    }
  }

  /**
   * Create compound collider from CSM (Compound Shape Mesh) object
   * CSM objects contain SMO and/or MMO children that are combined into a compound shape
   */
  private createCompoundColliderFromCSM(
    csmObject: THREE.Object3D,
    motionType: EMotionType,
    smoObjects: THREE.Mesh[],
    mmoObjects: THREE.Group[]
  ): { body: Body; bodyId: BodyID } | null {
    const Jolt = this.physics.jolt;
    const smoSet = new Set(smoObjects);
    const mmoSet = new Set(mmoObjects);

    try {
      // Collect SMO and MMO children
      const smoChildren: THREE.Mesh[] = [];
      const mmoChildren: THREE.Group[] = [];

      // Traverse direct children only (not nested)
      for (const child of csmObject.children) {
        if (child instanceof THREE.Mesh && smoSet.has(child)) {
          smoChildren.push(child);
        } else if (child instanceof THREE.Group && mmoSet.has(child)) {
          mmoChildren.push(child);
        }
      }

      if (smoChildren.length === 0 && mmoChildren.length === 0) {
        console.warn(
          `CSM object "${csmObject.name || 'Unnamed'}" has no valid SMO/MMO children`
        );
        return null;
      }

      // Create compound shape settings
      const compoundShapeSettings = new Jolt.StaticCompoundShapeSettings();
      const hullSettingsList: ConvexHullShapeSettings[] = [];
      let validShapeCount = 0;

      // Process SMO children
      for (const smoChild of smoChildren) {
        const hullSettings =
          this.createConvexHullShapeSettingsFromMesh(smoChild);
        if (!hullSettings) {
          console.warn(
            `Failed to create shape settings for SMO child "${smoChild.name || 'Unnamed'}"`
          );
          continue;
        }

        // Get child's local transform relative to CSM parent
        // Ensure matrix is updated to get accurate position/quaternion
        smoChild.updateMatrixWorld(false);
        // The child's position and rotation are already relative to the CSM parent
        const relativePos = smoChild.position.clone();
        const relativeQuat = smoChild.quaternion.clone();

        // Convert to Jolt types
        const pos = this.physics.unwrapVec3(relativePos);
        const rot = this.physics.unwrapQuat(relativeQuat);

        // Add shape to compound
        compoundShapeSettings.AddShape(pos, rot, hullSettings, 0);

        hullSettingsList.push(hullSettings);
        validShapeCount++;

        // Cleanup (Vec3 and Quat are copied by AddShape)
        Jolt.destroy(pos);
        Jolt.destroy(rot);
      }

      // Process MMO children
      for (const mmoChild of mmoChildren) {
        const hullSettings =
          this.createConvexHullShapeSettingsFromGroup(mmoChild);
        if (!hullSettings) {
          console.warn(
            `Failed to create shape settings for MMO child "${mmoChild.name || 'Unnamed'}"`
          );
          continue;
        }

        // Get child's local transform relative to CSM parent
        // Ensure matrix is updated to get accurate position/quaternion
        mmoChild.updateMatrixWorld(false);
        // The child's position and rotation are already relative to the CSM parent
        const relativePos = mmoChild.position.clone();
        const relativeQuat = mmoChild.quaternion.clone();

        // Convert to Jolt types
        const pos = this.physics.unwrapVec3(relativePos);
        const rot = this.physics.unwrapQuat(relativeQuat);

        // Add shape to compound
        compoundShapeSettings.AddShape(pos, rot, hullSettings, 0);

        hullSettingsList.push(hullSettings);
        validShapeCount++;

        // Cleanup (Vec3 and Quat are copied by AddShape)
        Jolt.destroy(pos);
        Jolt.destroy(rot);
      }

      if (validShapeCount === 0) {
        console.warn(
          `No valid shapes created for CSM object "${csmObject.name || 'Unnamed'}"`
        );
        // Cleanup hull settings
        for (const hullSettings of hullSettingsList) {
          Jolt.destroy(hullSettings);
        }
        Jolt.destroy(compoundShapeSettings);
        return null;
      }

      // Create the compound shape
      let compoundShape: Shape;
      try {
        const shapeResult = compoundShapeSettings.Create();
        if (!shapeResult.IsValid()) {
          const errorMsg = shapeResult.GetError();
          console.error(
            `Failed to create compound shape for CSM "${csmObject.name || 'Unnamed'}": ${errorMsg}`
          );
          // Cleanup
          for (const hullSettings of hullSettingsList) {
            Jolt.destroy(hullSettings);
          }
          Jolt.destroy(compoundShapeSettings);
          return null;
        }
        compoundShape = shapeResult.Get();
      } catch (error) {
        console.error(
          `Exception creating compound shape for CSM "${csmObject.name || 'Unnamed'}":`,
          error
        );
        // Cleanup
        for (const hullSettings of hullSettingsList) {
          Jolt.destroy(hullSettings);
        }
        Jolt.destroy(compoundShapeSettings);
        return null;
      }

      // Cleanup hull settings (they are now owned by compound shape)
      // Note: After Create().Get(), the compound shape owns everything
      try {
        Jolt.destroy(compoundShapeSettings);
      } catch (error) {
        console.warn(
          `Error destroying compoundShapeSettings for CSM "${csmObject.name || 'Unnamed'}":`,
          error
        );
      }

      // Get CSM object's world transform
      csmObject.updateMatrixWorld(true);
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      csmObject.getWorldPosition(worldPosition);
      csmObject.getWorldQuaternion(worldQuaternion);

      const pos = this.physics.unwrapRVec3(worldPosition);
      const rot = this.physics.unwrapQuat(worldQuaternion);

      // Create body settings
      const bodySettings = new Jolt.BodyCreationSettings(
        compoundShape,
        pos,
        rot,
        motionType,
        LAYER_MOVING
      );

      // Create body
      const body = this.physics.getBodyInterface().CreateBody(bodySettings);

      // Cleanup
      Jolt.destroy(pos);
      Jolt.destroy(rot);
      Jolt.destroy(bodySettings);

      const bodyId = body.GetID();
      const motionTypeStr =
        motionType === Jolt.EMotionType_Dynamic
          ? 'Dynamic'
          : motionType === Jolt.EMotionType_Kinematic
            ? 'Kinematic'
            : motionType === Jolt.EMotionType_Static
              ? 'Static'
              : 'Other';

      console.log(
        `✅ Physics body created (Compound/CSM) for "${csmObject.name || 'Unnamed'}": ID=${bodyId}, MotionType=${motionTypeStr}, SubShapes=${validShapeCount}`
      );

      // Verify and activate body if needed
      const bodyInterface = this.physics.getBodyInterface();
      const isBodyValid = bodyInterface.IsAdded(bodyId);

      if (motionType === Jolt.EMotionType_Dynamic && isBodyValid) {
        const isActive = bodyInterface.IsActive(bodyId);
        if (!isActive) {
          console.log(
            `  └─ Activating body ${bodyId.GetIndexAndSequenceNumber()}...`
          );
          bodyInterface.ActivateBody(bodyId);
        }

        // Log body position
        const bodyPos = this.physics.wrapVec3(body.GetPosition());
        console.log(
          `  └─ Body Position: (${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(2)}, ${bodyPos.z.toFixed(2)})`
        );

        // If body is at or below y=0, lift it up slightly
        if (bodyPos.y <= 0.1) {
          const liftPos = new Jolt.RVec3(bodyPos.x, bodyPos.y + 1.0, bodyPos.z);
          bodyInterface.SetPosition(bodyId, liftPos, Jolt.EActivation_Activate);
          Jolt.destroy(liftPos);
          console.log(`  └─ Lifted body up by 1.0 units to ensure it falls`);
        }
      }

      return { body, bodyId };
    } catch (error) {
      console.warn(
        `Failed to create compound collider for CSM "${csmObject.name || 'Unnamed'}":`,
        error
      );
      return null;
    }
  }

  /**
   * Sync visual objects with physics bodies
   */
  private syncModelWithPhysics(): void {
    // Step 1: Get physics interface and dynamic objects
    const bodyInterface = this.physics.getBodyInterface();
    const bodiesToRemove: BodyID[] = [];
    const dynamicObjects = this.physics.getDynamicObjects();

    // Step 2: Helper function to sync a visual object with physics body
    const syncVisualObject = (visualObject: THREE.Object3D, bodyId: BodyID) => {
      // Step 2.1: Check if body is still active
      if (!bodyInterface.IsAdded(bodyId)) {
        // Body has been removed, mark for cleanup
        bodiesToRemove.push(bodyId);
        return;
      }

      // Step 2.2: Find the body in dynamicObjects to get its current position
      const bodyObj = dynamicObjects.find((obj) => {
        const objId = obj.body.GetID();
        return (
          objId.GetIndexAndSequenceNumber() ===
          bodyId.GetIndexAndSequenceNumber()
        );
      });

      if (bodyObj && bodyObj.body) {
        const body = bodyObj.body;
        const pos = this.physics.wrapVec3(body.GetPosition());
        const rot = this.physics.wrapQuat(body.GetRotation());

        // Step 2.3: Update the visual object's position to match physics body
        if (isFinite(pos.x) && isFinite(pos.y) && isFinite(pos.z)) {
          visualObject.position.set(pos.x, pos.y, pos.z);
        }

        // Step 2.4: Update the visual object's rotation to match physics body
        if (
          isFinite(rot.x) &&
          isFinite(rot.y) &&
          isFinite(rot.z) &&
          isFinite(rot.w)
        ) {
          visualObject.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        }

        // Step 2.5: Update matrix world
        visualObject.updateMatrixWorld(true);
      }
    };

    // Step 3: Sync all visual objects with their physics bodies
    // Step 3.1: Sync CSM objects
    this.bodyToCSMMap.forEach((csmObject, bodyId) => {
      syncVisualObject(csmObject, bodyId);
    });

    // Step 3.2: Sync groups (MMO objects)
    this.bodyToGroupMap.forEach((group, bodyId) => {
      syncVisualObject(group, bodyId);
    });

    // Step 3.3: Sync meshes (SMO objects)
    this.bodyToMeshMap.forEach((mesh, bodyId) => {
      syncVisualObject(mesh, bodyId);
    });

    // Step 4: Clean up removed bodies from the mappings
    // Note: Visual groups are already cleaned up by T3DPhysics.removeFromScene
    for (const bodyId of bodiesToRemove) {
      this.bodyToCSMMap.delete(bodyId);
      this.bodyToGroupMap.delete(bodyId);
      this.bodyToMeshMap.delete(bodyId);
    }
  }

  /**
   * Verify and log information about created physics bodies
   */
  private verifyBodies(): void {
    const dynamicObjects = this.physics.getDynamicObjects();
    const bodyInterface = this.physics.getBodyInterface();
    const scene = this.engine.getScene();

    console.log('\n' + '='.repeat(60));
    console.log('🎯 PHYSICS BODIES VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total bodies created: ${dynamicObjects.length}`);

    if (dynamicObjects.length > 0) {
      let registeredCount = 0;
      let activeCount = 0;
      let debugMeshCount = 0;
      let inSceneCount = 0;

      const bodyDetails = dynamicObjects.map((obj) => {
        const bodyId = obj.body.GetID();
        const isRegistered = bodyInterface.IsAdded(bodyId);
        if (isRegistered) registeredCount++;

        // Check if body is active (registered bodies are typically active)
        const isActive = isRegistered;
        if (isActive) activeCount++;

        const hasDebugMesh = !!obj.debugMesh;
        if (hasDebugMesh) debugMeshCount++;

        const debugMeshInScene = obj.debugMesh
          ? scene.children.includes(obj.debugMesh)
          : false;
        if (debugMeshInScene) inSceneCount++;

        return {
          id: bodyId,
          registered: isRegistered,
          active: isActive,
          shapeType: obj.shapeType,
          hasDebugMesh,
          debugMeshInScene,
        };
      });

      console.log(`\nRegistration Status:`);
      console.log(
        `  ✅ Registered: ${registeredCount}/${dynamicObjects.length}`
      );
      console.log(`  ✅ Active: ${activeCount}/${dynamicObjects.length}`);
      console.log(
        `  ✅ Debug meshes created: ${debugMeshCount}/${dynamicObjects.length}`
      );
      console.log(
        `  ✅ Debug meshes in scene: ${inSceneCount}/${dynamicObjects.length}`
      );

      console.log(`\nDetailed Body Information:`);
      bodyDetails.forEach((detail, index) => {
        console.log(
          `  ${index + 1}. Body ID: ${detail.id} | Shape: ${detail.shapeType}`
        );
        console.log(
          `     Registered: ${detail.registered ? '✅' : '❌'} | Active: ${detail.active ? '✅' : '❌'}`
        );
        console.log(
          `     Debug Mesh: ${detail.hasDebugMesh ? '✅' : '❌'} | In Scene: ${detail.debugMeshInScene ? '✅' : '❌'}`
        );
      });

      // Overall status
      const allGood =
        registeredCount === dynamicObjects.length &&
        activeCount === dynamicObjects.length &&
        debugMeshCount === dynamicObjects.length &&
        inSceneCount === dynamicObjects.length;

      console.log('\n' + '='.repeat(60));
      if (allGood) {
        console.log('✅ ALL PHYSICS BODIES PROPERLY REGISTERED AND ACTIVE');
      } else {
        console.log('⚠️  SOME ISSUES DETECTED - CHECK DETAILS ABOVE');
      }
      console.log('='.repeat(60));
    } else {
      console.log('⚠️  No physics bodies found in dynamicObjects array');
    }
  }

  /**
   * Main build method - processes a 3D model and creates physics bodies for all objects
   *
   * This method orchestrates the complete physics object creation pipeline:
   *
   * 1. **Object Extraction**: Identifies and extracts three types of objects from the model:
   *    - SMO (Single Material Object): Individual meshes with a single material
   *    - MMO (Multi Material Object): Groups containing only Mesh children
   *    - CSM (Compound Shape Mesh): Object3D/Group containers with SMO/MMO children
   *
   * 2. **Processing Order**: Processes objects in priority order:
   *    - CSM objects are processed FIRST (create compound colliders from their children)
   *    - SMO/MMO objects that are part of CSM are excluded from individual processing
   *    - Remaining MMO objects are processed (create convex hull/compound colliders)
   *    - Remaining SMO objects are processed (create convex hull/mesh colliders)
   *
   * 3. **Collider Creation**: Creates appropriate physics colliders for each object type:
   *    - CSM: Compound shapes combining SMO/MMO children
   *    - MMO: Convex hull or compound shapes (depending on motion type)
   *    - SMO: Convex hull for dynamic/kinematic, mesh collider for static
   *
   * 4. **Body Registration**: All created bodies are registered with T3DPhysics's
   *    dynamicObjects array via physics.registerPhysicsBody() after creation
   *
   * 5. **Mapping Storage**: Stores body-to-visual-object mappings for frame-by-frame syncing:
   *    - bodyToCSMMap: Maps body IDs to CSM Object3D objects
   *    - bodyToGroupMap: Maps body IDs to MMO Group objects
   *    - bodyToMeshMap: Maps body IDs to SMO Mesh objects
   *
   * 6. **Verification**: Optionally verifies and logs comprehensive information about
   *    all created physics bodies (registration status, active state, debug meshes)
   *
   * 7. **Frame Synchronization**: Registers a frame callback to continuously sync visual
   *    objects with their physics body positions and rotations (if enabled)
   *
   * 8. **Optional Features**: Can create a test falling sphere and ground plane for
   *    physics verification and testing purposes
   *
   * @param model - The THREE.Group model to process and create physics bodies for
   * @param options - Configuration options for the build process:
   *   - motionType: Motion type for physics bodies (default: Dynamic)
   *   - enableSync: Enable frame-by-frame visual object syncing (default: true)
   *   - enableVerification: Enable comprehensive verification logging (default: true)
   *   - createTestSphere: Create a test falling sphere (default: true)
   *   - createGroundPlane: Create a ground plane (default: true)
   *
   * @throws Error if physics system is not properly initialized
   */
  public async build(
    model: THREE.Group,
    options?: T3DPhysicsObjectBuilderOptions
  ): Promise<void> {
    // Step 1: Extract options with defaults
    const Jolt = this.physics.jolt;
    const motionType = options?.motionType ?? Jolt.EMotionType_Dynamic;
    const enableSync = options?.enableSync ?? true;
    const enableVerification = options?.enableVerification ?? true;
    const createTestSphere = options?.createTestSphere ?? true;
    const createGroundPlane = options?.createGroundPlane ?? true;

    console.log(
      '[T3DPhysicsObjectBuilder] Building physics objects for model:',
      model
    );

    // Step 2: Clear existing mappings
    this.bodyToGroupMap.clear();
    this.bodyToMeshMap.clear();
    this.bodyToCSMMap.clear();

    // Step 3: Extract objects from model (SMO, MMO, CSM)
    const smoObjects = T3DPhysicsObjectBuilder.getSMOObjects(model);
    const mmoObjects = T3DPhysicsObjectBuilder.getMMOObjects(model);
    const csmObjects = T3DPhysicsObjectBuilder.getCSMObjects(
      model,
      smoObjects,
      mmoObjects
    );

    // Step 4: Process objects in priority order (CSM first, then filtered SMO/MMO)
    if (csmObjects.length > 0) {
      console.log(
        `[T3DPhysicsObjectBuilder] Found ${csmObjects.length} CSM object(s) to process`
      );

      // Step 4.1: Track which SMO/MMO objects are part of CSM to exclude them later
      const smoInCSM = new Set<THREE.Mesh>();
      const mmoInCSM = new Set<THREE.Group>();

      // Step 4.2: Process CSM objects first
      csmObjects.forEach((csmObject) => {
        // Step 4.2.1: Collect SMO/MMO children to mark them as processed
        for (const child of csmObject.children) {
          if (child instanceof THREE.Mesh && smoObjects.includes(child)) {
            smoInCSM.add(child);
          } else if (
            child instanceof THREE.Group &&
            mmoObjects.includes(child)
          ) {
            mmoInCSM.add(child);
          }
        }

        // Step 4.2.2: Create compound collider for CSM
        const result = this.createCompoundColliderFromCSM(
          csmObject,
          motionType,
          smoObjects,
          mmoObjects
        );

        // Step 4.2.3: Register body and store mapping for syncing
        if (result) {
          this.physics.registerPhysicsBody({
            body: result.body,
            visualGroup: csmObject,
          });
          this.bodyToCSMMap.set(result.bodyId, csmObject);
        }
      });

      // Step 4.3: Filter out SMO/MMO objects that are part of CSM
      const filteredSmoObjects = smoObjects.filter(
        (mesh) => !smoInCSM.has(mesh)
      );
      const filteredMmoObjects = mmoObjects.filter(
        (group) => !mmoInCSM.has(group)
      );

      console.log(
        `[T3DPhysicsObjectBuilder] ${smoInCSM.size} SMO and ${mmoInCSM.size} MMO objects are part of CSM, will be excluded from individual processing`
      );

      // Step 4.4: Process remaining MMO objects (filtered list)
      if (filteredMmoObjects.length > 0) {
        console.log(
          `[T3DPhysicsObjectBuilder] Found ${filteredMmoObjects.length} MMO object(s) to process (excluding ${mmoInCSM.size} in CSM)`
        );

        filteredMmoObjects.forEach((group) => {
          const result = this.createConvexHullColliderFromGroup(
            group,
            motionType
          );

          if (result) {
            this.bodyToGroupMap.set(result.bodyId, group);
          }
        });
      }

      // Step 4.5: Process remaining SMO objects (filtered list)
      if (filteredSmoObjects.length > 0) {
        console.log(
          `[T3DPhysicsObjectBuilder] Found ${filteredSmoObjects.length} SMO object(s) to process (excluding ${smoInCSM.size} in CSM)`
        );

        filteredSmoObjects.forEach((mesh) => {
          const result = this.createConvexHullColliderFromMesh(
            mesh,
            motionType
          );

          if (result) {
            this.bodyToMeshMap.set(result.bodyId, mesh);
          }
        });
      }
    } else {
      // Step 5: No CSM objects, process all SMO/MMO objects normally
      // Step 5.1: Process MMO objects
      if (mmoObjects.length > 0) {
        console.log(
          `[T3DPhysicsObjectBuilder] Found ${mmoObjects.length} MMO object(s) to process`
        );

        mmoObjects.forEach((group) => {
          const result = this.createConvexHullColliderFromGroup(
            group,
            motionType
          );

          if (result) {
            this.bodyToGroupMap.set(result.bodyId, group);
          }
        });
      }

      // Step 5.2: Process SMO objects
      if (smoObjects.length > 0) {
        console.log(
          `[T3DPhysicsObjectBuilder] Found ${smoObjects.length} SMO object(s) to process`
        );

        smoObjects.forEach((mesh) => {
          const result = this.createConvexHullColliderFromMesh(
            mesh,
            motionType
          );

          if (result) {
            this.bodyToMeshMap.set(result.bodyId, mesh);
          }
        });
      }
    }

    // Step 6: Verification (if enabled)
    if (enableVerification) {
      this.verifyBodies();
    }

    // Step 7: Frame synchronization (if enabled)
    if (enableSync && this.engine.onFrame)
    {
      this.syncCleanupCallback = this.engine.onFrame(() => {
        this.syncModelWithPhysics();
      });
    }

    // Step 8: Optional features
    // Step 8.1: Create test falling sphere (if enabled)
    if (createTestSphere) {
      console.log('\n🧪 Adding test falling sphere to verify physics...');
      try {
        const testPos = new Jolt.RVec3(0, 10, 0); // Position above the model
        const testSphere = this.physics.createSphere(
          testPos,
          1.0, // Radius
          Jolt.EMotionType_Dynamic, // Dynamic so it falls
          LAYER_MOVING
        );
        Jolt.destroy(testPos);
        console.log(
          `✅ Test sphere created: ID=${testSphere.GetID()}, should fall with gravity`
        );
      } catch (error) {
        console.warn('Failed to create test sphere:', error);
      }
    }

    // Step 8.2: Create ground plane (if enabled)
    if (createGroundPlane) {
      const groundPlane = this.physics.createFloor();
      console.log(`✅ Ground plane created: ID=${groundPlane.GetID()}`);
    }
  }

  /**
   * Get access to body-to-visual-object mappings
   */
  public getMappings(): T3DPhysicsObjectBuilderMappings {
    return {
      bodyToGroupMap: this.bodyToGroupMap,
      bodyToMeshMap: this.bodyToMeshMap,
      bodyToCSMMap: this.bodyToCSMMap,
    };
  }

  /**
   * Clean up frame callbacks and mappings
   */
  public cleanup(): void {
    // Unregister frame callback
    if (this.syncCleanupCallback) {
      this.syncCleanupCallback();
      this.syncCleanupCallback = null;
    }

    // Clear mappings
    this.bodyToGroupMap.clear();
    this.bodyToMeshMap.clear();
    this.bodyToCSMMap.clear();
  }
}
