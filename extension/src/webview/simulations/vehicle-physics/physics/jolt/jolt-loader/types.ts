/**
 * Comprehensive TypeScript type definitions for Jolt Physics
 *
 * This file extracts all types from the jolt-physics package module instance.
 * Since the package doesn't export types directly, we extract them from the
 * module instance type using InstanceType utility.
 */

// Extract the Jolt module type from the factory function's return type
// The jolt-physics package exports a default function that returns Promise<JoltModule>
type JoltFactory = typeof import('jolt-physics').default;
export type JoltModule = Awaited<ReturnType<JoltFactory>>;

// Helper type to extract instance types from the Jolt module
// Only extracts types when the property is a constructor, otherwise returns never
type JoltInstanceType<T extends keyof JoltModule> =
  JoltModule[T] extends abstract new (...args: any[]) => infer R
    ? R
    : JoltModule[T] extends new (...args: any[]) => infer R
      ? R
      : never;

// ============================================================================
// Core Types
// ============================================================================

export type JoltInterface = JoltInstanceType<'JoltInterface'>;
export type JoltSettings = JoltInstanceType<'JoltSettings'>;

// ============================================================================
// Math Types
// ============================================================================

export type Vec3 = JoltInstanceType<'Vec3'>;
export type RVec3 = JoltInstanceType<'RVec3'>;
export type Vec4 = JoltInstanceType<'Vec4'>;
export type Vector2 = JoltInstanceType<'Vector2'>;
export type Quat = JoltInstanceType<'Quat'>;
export type Float3 = JoltInstanceType<'Float3'>;
export type Mat44 = JoltInstanceType<'Mat44'>;
export type RMat44 = JoltInstanceType<'RMat44'>;
export type AABox = JoltInstanceType<'AABox'>;
export type OrientedBox = JoltInstanceType<'OrientedBox'>;
export type Plane = JoltInstanceType<'Plane'>;

// ============================================================================
// Memory Reference Types
// ============================================================================

export type Vec3MemRef = JoltInstanceType<'Vec3MemRef'>;
export type QuatMemRef = JoltInstanceType<'QuatMemRef'>;
export type Mat44MemRef = JoltInstanceType<'Mat44MemRef'>;
export type BodyIDMemRef = JoltInstanceType<'BodyIDMemRef'>;
export type BodyPtrMemRef = JoltInstanceType<'BodyPtrMemRef'>;
export type FloatMemRef = JoltInstanceType<'FloatMemRef'>;
export type Uint8MemRef = JoltInstanceType<'Uint8MemRef'>;
export type UintMemRef = JoltInstanceType<'UintMemRef'>;

// ============================================================================
// Array Types
// ============================================================================

export type ArrayVec3 = JoltInstanceType<'ArrayVec3'>;
export type ArrayQuat = JoltInstanceType<'ArrayQuat'>;
export type ArrayMat44 = JoltInstanceType<'ArrayMat44'>;
export type ArrayBodyID = JoltInstanceType<'ArrayBodyID'>;
export type ArrayBodyPtr = JoltInstanceType<'ArrayBodyPtr'>;
export type ArrayFloat = JoltInstanceType<'ArrayFloat'>;
export type ArrayUint = JoltInstanceType<'ArrayUint'>;
export type ArrayUint8 = JoltInstanceType<'ArrayUint8'>;
export type ArrayRayCastResult = JoltInstanceType<'ArrayRayCastResult'>;
export type ArrayCollidePointResult =
  JoltInstanceType<'ArrayCollidePointResult'>;
export type ArrayCollideShapeResult =
  JoltInstanceType<'ArrayCollideShapeResult'>;
export type ArrayShapeCastResult = JoltInstanceType<'ArrayShapeCastResult'>;
export type ArraySoftBodySharedSettingsVertex =
  JoltInstanceType<'ArraySoftBodySharedSettingsVertex'>;
export type ArraySoftBodySharedSettingsFace =
  JoltInstanceType<'ArraySoftBodySharedSettingsFace'>;
export type ArraySoftBodySharedSettingsEdge =
  JoltInstanceType<'ArraySoftBodySharedSettingsEdge'>;
export type ArraySoftBodySharedSettingsDihedralBend =
  JoltInstanceType<'ArraySoftBodySharedSettingsDihedralBend'>;
export type ArraySoftBodySharedSettingsVolume =
  JoltInstanceType<'ArraySoftBodySharedSettingsVolume'>;
export type ArraySoftBodySharedSettingsInvBind =
  JoltInstanceType<'ArraySoftBodySharedSettingsInvBind'>;
export type ArraySoftBodySharedSettingsSkinned =
  JoltInstanceType<'ArraySoftBodySharedSettingsSkinned'>;
export type ArraySoftBodySharedSettingsLRA =
  JoltInstanceType<'ArraySoftBodySharedSettingsLRA'>;
export type ArraySoftBodySharedSettingsRodStretchShear =
  JoltInstanceType<'ArraySoftBodySharedSettingsRodStretchShear'>;
export type ArraySoftBodySharedSettingsRodBendTwist =
  JoltInstanceType<'ArraySoftBodySharedSettingsRodBendTwist'>;
export type ArraySoftBodySharedSettingsVertexAttributes =
  JoltInstanceType<'ArraySoftBodySharedSettingsVertexAttributes'>;
export type ArraySoftBodyVertex = JoltInstanceType<'ArraySoftBodyVertex'>;
export type ArrayCharacterVirtualContact =
  JoltInstanceType<'ArrayCharacterVirtualContact'>;
export type ArrayVehicleAntiRollBar =
  JoltInstanceType<'ArrayVehicleAntiRollBar'>;
export type ArrayWheelSettings = JoltInstanceType<'ArrayWheelSettings'>;
export type ArrayVehicleDifferentialSettings =
  JoltInstanceType<'ArrayVehicleDifferentialSettings'>;

// ============================================================================
// String and Utility Types
// ============================================================================

export type JPHString = JoltInstanceType<'JPHString'>;
export type TempAllocator = JoltInstanceType<'TempAllocator'>;

// ============================================================================
// Ray Casting Types
// ============================================================================

export type RayCast = JoltInstanceType<'RayCast'>;
export type RRayCast = JoltInstanceType<'RRayCast'>;
export type RayCastResult = JoltInstanceType<'RayCastResult'>;
export type RayCastSettings = JoltInstanceType<'RayCastSettings'>;
export type BroadPhaseCastResult = JoltInstanceType<'BroadPhaseCastResult'>;
export type AABoxCast = JoltInstanceType<'AABoxCast'>;
export type ShapeCast = JoltInstanceType<'ShapeCast'>;
export type RShapeCast = JoltInstanceType<'RShapeCast'>;
export type ShapeCastSettings = JoltInstanceType<'ShapeCastSettings'>;
export type ShapeCastResult = JoltInstanceType<'ShapeCastResult'>;

// ============================================================================
// Shape Types
// ============================================================================

export type Shape = JoltInstanceType<'Shape'>;
export type ShapeSettings = JoltInstanceType<'ShapeSettings'>;
export type ShapeResult = JoltInstanceType<'ShapeResult'>;
export type ShapeGetTriangles = JoltInstanceType<'ShapeGetTriangles'>;
export type TransformedShape = JoltInstanceType<'TransformedShape'>;

// Convex Shapes
export type ConvexShape = JoltInstanceType<'ConvexShape'>;
export type ConvexShapeSettings = JoltInstanceType<'ConvexShapeSettings'>;
export type SphereShape = JoltInstanceType<'SphereShape'>;
export type SphereShapeSettings = JoltInstanceType<'SphereShapeSettings'>;
export type BoxShape = JoltInstanceType<'BoxShape'>;
export type BoxShapeSettings = JoltInstanceType<'BoxShapeSettings'>;
export type CylinderShape = JoltInstanceType<'CylinderShape'>;
export type CylinderShapeSettings = JoltInstanceType<'CylinderShapeSettings'>;
export type TaperedCylinderShape = JoltInstanceType<'TaperedCylinderShape'>;
export type TaperedCylinderShapeSettings =
  JoltInstanceType<'TaperedCylinderShapeSettings'>;
export type CapsuleShape = JoltInstanceType<'CapsuleShape'>;
export type CapsuleShapeSettings = JoltInstanceType<'CapsuleShapeSettings'>;
export type TaperedCapsuleShape = JoltInstanceType<'TaperedCapsuleShape'>;
export type TaperedCapsuleShapeSettings =
  JoltInstanceType<'TaperedCapsuleShapeSettings'>;
export type ConvexHullShape = JoltInstanceType<'ConvexHullShape'>;
export type ConvexHullShapeSettings =
  JoltInstanceType<'ConvexHullShapeSettings'>;

// Compound Shapes
export type CompoundShape = JoltInstanceType<'CompoundShape'>;
export type CompoundShapeSettings = JoltInstanceType<'CompoundShapeSettings'>;
export type CompoundShapeSubShape = JoltInstanceType<'CompoundShapeSubShape'>;
export type StaticCompoundShape = JoltInstanceType<'StaticCompoundShape'>;
export type StaticCompoundShapeSettings =
  JoltInstanceType<'StaticCompoundShapeSettings'>;
export type MutableCompoundShape = JoltInstanceType<'MutableCompoundShape'>;
export type MutableCompoundShapeSettings =
  JoltInstanceType<'MutableCompoundShapeSettings'>;

// Decorated Shapes
export type DecoratedShape = JoltInstanceType<'DecoratedShape'>;
export type DecoratedShapeSettings = JoltInstanceType<'DecoratedShapeSettings'>;
export type ScaledShape = JoltInstanceType<'ScaledShape'>;
export type ScaledShapeSettings = JoltInstanceType<'ScaledShapeSettings'>;
export type OffsetCenterOfMassShape =
  JoltInstanceType<'OffsetCenterOfMassShape'>;
export type OffsetCenterOfMassShapeSettings =
  JoltInstanceType<'OffsetCenterOfMassShapeSettings'>;
export type RotatedTranslatedShape = JoltInstanceType<'RotatedTranslatedShape'>;
export type RotatedTranslatedShapeSettings =
  JoltInstanceType<'RotatedTranslatedShapeSettings'>;

// Mesh and Height Field Shapes
export type MeshShape = JoltInstanceType<'MeshShape'>;
export type MeshShapeSettings = JoltInstanceType<'MeshShapeSettings'>;
export type HeightFieldShape = JoltInstanceType<'HeightFieldShape'>;
export type HeightFieldShapeSettings =
  JoltInstanceType<'HeightFieldShapeSettings'>;
export type HeightFieldShapeConstantValues =
  JoltInstanceType<'HeightFieldShapeConstantValues'>;
export type PlaneShape = JoltInstanceType<'PlaneShape'>;
export type PlaneShapeSettings = JoltInstanceType<'PlaneShapeSettings'>;
export type EmptyShape = JoltInstanceType<'EmptyShape'>;
export type EmptyShapeSettings = JoltInstanceType<'EmptyShapeSettings'>;

// ============================================================================
// Material Types
// ============================================================================

export type PhysicsMaterial = JoltInstanceType<'PhysicsMaterial'>;
export type PhysicsMaterialList = JoltInstanceType<'PhysicsMaterialList'>;

// ============================================================================
// Geometry Types
// ============================================================================

export type Triangle = JoltInstanceType<'Triangle'>;
export type TriangleList = JoltInstanceType<'TriangleList'>;
export type VertexList = JoltInstanceType<'VertexList'>;
export type IndexedTriangle = JoltInstanceType<'IndexedTriangle'>;
export type IndexedTriangleList = JoltInstanceType<'IndexedTriangleList'>;

// ============================================================================
// Body Types
// ============================================================================

export type Body = JoltInstanceType<'Body'>;
export type BodyID = JoltInstanceType<'BodyID'>;
export type SubShapeID = JoltInstanceType<'SubShapeID'>;
export type MotionProperties = JoltInstanceType<'MotionProperties'>;
export type BodyCreationSettings = JoltInstanceType<'BodyCreationSettings'>;
export type BodyInterface = JoltInstanceType<'BodyInterface'>;
export type BodyInterface_AddState = JoltInstanceType<'BodyInterface_AddState'>;
export type BodyIDVector = JoltInstanceType<'BodyIDVector'>;

// ============================================================================
// Collision and Group Filter Types
// ============================================================================

export type CollisionGroup = JoltInstanceType<'CollisionGroup'>;
export type GroupFilter = JoltInstanceType<'GroupFilter'>;
export type GroupFilterJS = JoltInstanceType<'GroupFilterJS'>;
export type GroupFilterTable = JoltInstanceType<'GroupFilterTable'>;

// ============================================================================
// Body Lock Types
// ============================================================================

export type BodyLockInterface = JoltInstanceType<'BodyLockInterface'>;
export type BodyLockInterfaceNoLock =
  JoltInstanceType<'BodyLockInterfaceNoLock'>;
export type BodyLockInterfaceLocking =
  JoltInstanceType<'BodyLockInterfaceLocking'>;

// ============================================================================
// Physics System Types
// ============================================================================

export type PhysicsSystem = JoltInstanceType<'PhysicsSystem'>;
export type PhysicsSettings = JoltInstanceType<'PhysicsSettings'>;
export type MassProperties = JoltInstanceType<'MassProperties'>;

// ============================================================================
// Constraint Types
// ============================================================================

export type Constraint = JoltInstanceType<'Constraint'>;
export type ConstraintSettings = JoltInstanceType<'ConstraintSettings'>;
export type TwoBodyConstraint = JoltInstanceType<'TwoBodyConstraint'>;
export type TwoBodyConstraintSettings =
  JoltInstanceType<'TwoBodyConstraintSettings'>;

// Specific Constraint Types
export type FixedConstraintSettings =
  JoltInstanceType<'FixedConstraintSettings'>;
export type DistanceConstraint = JoltInstanceType<'DistanceConstraint'>;
export type DistanceConstraintSettings =
  JoltInstanceType<'DistanceConstraintSettings'>;
export type PointConstraint = JoltInstanceType<'PointConstraint'>;
export type PointConstraintSettings =
  JoltInstanceType<'PointConstraintSettings'>;
export type HingeConstraint = JoltInstanceType<'HingeConstraint'>;
export type HingeConstraintSettings =
  JoltInstanceType<'HingeConstraintSettings'>;
export type ConeConstraint = JoltInstanceType<'ConeConstraint'>;
export type ConeConstraintSettings = JoltInstanceType<'ConeConstraintSettings'>;
export type SliderConstraint = JoltInstanceType<'SliderConstraint'>;
export type SliderConstraintSettings =
  JoltInstanceType<'SliderConstraintSettings'>;
export type SwingTwistConstraint = JoltInstanceType<'SwingTwistConstraint'>;
export type SwingTwistConstraintSettings =
  JoltInstanceType<'SwingTwistConstraintSettings'>;
export type SixDOFConstraint = JoltInstanceType<'SixDOFConstraint'>;
export type SixDOFConstraintSettings =
  JoltInstanceType<'SixDOFConstraintSettings'>;
export type PathConstraint = JoltInstanceType<'PathConstraint'>;
export type PathConstraintSettings = JoltInstanceType<'PathConstraintSettings'>;
export type PathConstraintPath = JoltInstanceType<'PathConstraintPath'>;
export type PathConstraintPathHermite =
  JoltInstanceType<'PathConstraintPathHermite'>;
export type PathConstraintPathEm = JoltInstanceType<'PathConstraintPathEm'>;
export type PathConstraintPathJS = JoltInstanceType<'PathConstraintPathJS'>;
export type PulleyConstraint = JoltInstanceType<'PulleyConstraint'>;
export type PulleyConstraintSettings =
  JoltInstanceType<'PulleyConstraintSettings'>;
export type GearConstraint = JoltInstanceType<'GearConstraint'>;
export type GearConstraintSettings = JoltInstanceType<'GearConstraintSettings'>;
export type RackAndPinionConstraint =
  JoltInstanceType<'RackAndPinionConstraint'>;
export type RackAndPinionConstraintSettings =
  JoltInstanceType<'RackAndPinionConstraintSettings'>;

// Constraint Helper Types
export type SpringSettings = JoltInstanceType<'SpringSettings'>;
export type MotorSettings = JoltInstanceType<'MotorSettings'>;

// ============================================================================
// Contact and Collision Types
// ============================================================================

export type ContactPoints = JoltInstanceType<'ContactPoints'>;
export type ContactManifold = JoltInstanceType<'ContactManifold'>;
export type ContactSettings = JoltInstanceType<'ContactSettings'>;
export type SubShapeIDPair = JoltInstanceType<'SubShapeIDPair'>;
export type CollideShapeResult = JoltInstanceType<'CollideShapeResult'>;
export type CollideShapeResultFace = JoltInstanceType<'CollideShapeResultFace'>;
export type CollidePointResult = JoltInstanceType<'CollidePointResult'>;

// ============================================================================
// Listener Types
// ============================================================================

export type ContactListener = JoltInstanceType<'ContactListener'>;
export type ContactListenerEm = JoltInstanceType<'ContactListenerEm'>;
export type ContactListenerJS = JoltInstanceType<'ContactListenerJS'>;
export type SoftBodyContactListener =
  JoltInstanceType<'SoftBodyContactListener'>;
export type SoftBodyContactListenerEm =
  JoltInstanceType<'SoftBodyContactListenerEm'>;
export type SoftBodyContactListenerJS =
  JoltInstanceType<'SoftBodyContactListenerJS'>;
export type PhysicsStepListener = JoltInstanceType<'PhysicsStepListener'>;
export type PhysicsStepListenerJS = JoltInstanceType<'PhysicsStepListenerJS'>;
export type PhysicsStepListenerContext =
  JoltInstanceType<'PhysicsStepListenerContext'>;
export type BodyActivationListener = JoltInstanceType<'BodyActivationListener'>;
export type BodyActivationListenerJS =
  JoltInstanceType<'BodyActivationListenerJS'>;

// ============================================================================
// Soft Body Types
// ============================================================================

export type SoftBodyManifold = JoltInstanceType<'SoftBodyManifold'>;
export type SoftBodyContactSettings =
  JoltInstanceType<'SoftBodyContactSettings'>;
export type SoftBodySharedSettings = JoltInstanceType<'SoftBodySharedSettings'>;
export type SoftBodySharedSettingsVertex =
  JoltInstanceType<'SoftBodySharedSettingsVertex'>;
export type SoftBodySharedSettingsFace =
  JoltInstanceType<'SoftBodySharedSettingsFace'>;
export type SoftBodySharedSettingsEdge =
  JoltInstanceType<'SoftBodySharedSettingsEdge'>;
export type SoftBodySharedSettingsDihedralBend =
  JoltInstanceType<'SoftBodySharedSettingsDihedralBend'>;
export type SoftBodySharedSettingsVolume =
  JoltInstanceType<'SoftBodySharedSettingsVolume'>;
export type SoftBodySharedSettingsInvBind =
  JoltInstanceType<'SoftBodySharedSettingsInvBind'>;
export type SoftBodySharedSettingsSkinWeight =
  JoltInstanceType<'SoftBodySharedSettingsSkinWeight'>;
export type SoftBodySharedSettingsSkinned =
  JoltInstanceType<'SoftBodySharedSettingsSkinned'>;
export type SoftBodySharedSettingsLRA =
  JoltInstanceType<'SoftBodySharedSettingsLRA'>;
export type SoftBodySharedSettingsRodStretchShear =
  JoltInstanceType<'SoftBodySharedSettingsRodStretchShear'>;
export type SoftBodySharedSettingsRodBendTwist =
  JoltInstanceType<'SoftBodySharedSettingsRodBendTwist'>;
export type SoftBodySharedSettingsVertexAttributes =
  JoltInstanceType<'SoftBodySharedSettingsVertexAttributes'>;
export type SoftBodyCreationSettings =
  JoltInstanceType<'SoftBodyCreationSettings'>;
export type SoftBodyVertex = JoltInstanceType<'SoftBodyVertex'>;
export type SoftBodyVertexTraits = JoltInstanceType<'SoftBodyVertexTraits'>;
export type SoftBodyMotionProperties =
  JoltInstanceType<'SoftBodyMotionProperties'>;
export type SoftBodyShape = JoltInstanceType<'SoftBodyShape'>;

// ============================================================================
// Collector Types
// ============================================================================

export type RayCastBodyCollector = JoltInstanceType<'RayCastBodyCollector'>;
export type RayCastBodyCollectorJS = JoltInstanceType<'RayCastBodyCollectorJS'>;
export type CollideShapeBodyCollector =
  JoltInstanceType<'CollideShapeBodyCollector'>;
export type CollideShapeBodyCollectorJS =
  JoltInstanceType<'CollideShapeBodyCollectorJS'>;
export type CastShapeBodyCollector = JoltInstanceType<'CastShapeBodyCollector'>;
export type CastShapeBodyCollectorJS =
  JoltInstanceType<'CastShapeBodyCollectorJS'>;
export type CastRayCollector = JoltInstanceType<'CastRayCollector'>;
export type CastRayCollectorJS = JoltInstanceType<'CastRayCollectorJS'>;
export type CastRayAllHitCollisionCollector =
  JoltInstanceType<'CastRayAllHitCollisionCollector'>;
export type CastRayClosestHitCollisionCollector =
  JoltInstanceType<'CastRayClosestHitCollisionCollector'>;
export type CastRayAnyHitCollisionCollector =
  JoltInstanceType<'CastRayAnyHitCollisionCollector'>;
export type CollidePointCollector = JoltInstanceType<'CollidePointCollector'>;
export type CollidePointCollectorJS =
  JoltInstanceType<'CollidePointCollectorJS'>;
export type CollidePointAllHitCollisionCollector =
  JoltInstanceType<'CollidePointAllHitCollisionCollector'>;
export type CollidePointClosestHitCollisionCollector =
  JoltInstanceType<'CollidePointClosestHitCollisionCollector'>;
export type CollidePointAnyHitCollisionCollector =
  JoltInstanceType<'CollidePointAnyHitCollisionCollector'>;
export type CollideShapeCollector = JoltInstanceType<'CollideShapeCollector'>;
export type CollideShapeCollectorJS =
  JoltInstanceType<'CollideShapeCollectorJS'>;
export type CollideShapeAllHitCollisionCollector =
  JoltInstanceType<'CollideShapeAllHitCollisionCollector'>;
export type CollideShapeClosestHitCollisionCollector =
  JoltInstanceType<'CollideShapeClosestHitCollisionCollector'>;
export type CollideShapeAnyHitCollisionCollector =
  JoltInstanceType<'CollideShapeAnyHitCollisionCollector'>;
export type CastShapeCollector = JoltInstanceType<'CastShapeCollector'>;
export type CastShapeCollectorJS = JoltInstanceType<'CastShapeCollectorJS'>;
export type CastShapeAllHitCollisionCollector =
  JoltInstanceType<'CastShapeAllHitCollisionCollector'>;
export type CastShapeClosestHitCollisionCollector =
  JoltInstanceType<'CastShapeClosestHitCollisionCollector'>;
export type CastShapeAnyHitCollisionCollector =
  JoltInstanceType<'CastShapeAnyHitCollisionCollector'>;
export type TransformedShapeCollector =
  JoltInstanceType<'TransformedShapeCollector'>;
export type TransformedShapeCollectorJS =
  JoltInstanceType<'TransformedShapeCollectorJS'>;

// ============================================================================
// Query Types
// ============================================================================

export type BroadPhaseQuery = JoltInstanceType<'BroadPhaseQuery'>;
export type NarrowPhaseQuery = JoltInstanceType<'NarrowPhaseQuery'>;
export type CollideSettingsBase = JoltInstanceType<'CollideSettingsBase'>;
export type CollideShapeSettings = JoltInstanceType<'CollideShapeSettings'>;

// ============================================================================
// State Recorder Types
// ============================================================================

export type StateRecorder = JoltInstanceType<'StateRecorder'>;
export type StateRecorderEm = JoltInstanceType<'StateRecorderEm'>;
export type StateRecorderJS = JoltInstanceType<'StateRecorderJS'>;
export type StateRecorderImpl = JoltInstanceType<'StateRecorderImpl'>;
export type StateRecorderFilter = JoltInstanceType<'StateRecorderFilter'>;
export type StateRecorderFilterJS = JoltInstanceType<'StateRecorderFilterJS'>;

// ============================================================================
// Character Types
// ============================================================================

export type CharacterBase = JoltInstanceType<'CharacterBase'>;
export type CharacterBaseSettings = JoltInstanceType<'CharacterBaseSettings'>;
export type CharacterVirtual = JoltInstanceType<'CharacterVirtual'>;
export type CharacterVirtualSettings =
  JoltInstanceType<'CharacterVirtualSettings'>;
export type CharacterID = JoltInstanceType<'CharacterID'>;
export type CharacterContactSettings =
  JoltInstanceType<'CharacterContactSettings'>;
export type CharacterContactListener =
  JoltInstanceType<'CharacterContactListener'>;
export type CharacterContactListenerEm =
  JoltInstanceType<'CharacterContactListenerEm'>;
export type CharacterContactListenerJS =
  JoltInstanceType<'CharacterContactListenerJS'>;
export type CharacterVsCharacterCollision =
  JoltInstanceType<'CharacterVsCharacterCollision'>;
export type CharacterVsCharacterCollisionSimple =
  JoltInstanceType<'CharacterVsCharacterCollisionSimple'>;
export type ExtendedUpdateSettings = JoltInstanceType<'ExtendedUpdateSettings'>;
export type CharacterVirtualContact =
  JoltInstanceType<'CharacterVirtualContact'>;

// ============================================================================
// Filter Types
// ============================================================================

export type BroadPhaseLayerFilter = JoltInstanceType<'BroadPhaseLayerFilter'>;
export type ObjectVsBroadPhaseLayerFilter =
  JoltInstanceType<'ObjectVsBroadPhaseLayerFilter'>;
export type ObjectVsBroadPhaseLayerFilterEm =
  JoltInstanceType<'ObjectVsBroadPhaseLayerFilterEm'>;
export type ObjectVsBroadPhaseLayerFilterJS =
  JoltInstanceType<'ObjectVsBroadPhaseLayerFilterJS'>;
export type DefaultBroadPhaseLayerFilter =
  JoltInstanceType<'DefaultBroadPhaseLayerFilter'>;
export type ObjectLayerFilter = JoltInstanceType<'ObjectLayerFilter'>;
export type ObjectLayerFilterJS = JoltInstanceType<'ObjectLayerFilterJS'>;
export type ObjectLayerPairFilter = JoltInstanceType<'ObjectLayerPairFilter'>;
export type ObjectLayerPairFilterJS =
  JoltInstanceType<'ObjectLayerPairFilterJS'>;
export type DefaultObjectLayerFilter =
  JoltInstanceType<'DefaultObjectLayerFilter'>;
export type SpecifiedObjectLayerFilter =
  JoltInstanceType<'SpecifiedObjectLayerFilter'>;
export type BodyFilter = JoltInstanceType<'BodyFilter'>;
export type BodyFilterJS = JoltInstanceType<'BodyFilterJS'>;
export type IgnoreSingleBodyFilter = JoltInstanceType<'IgnoreSingleBodyFilter'>;
export type IgnoreMultipleBodiesFilter =
  JoltInstanceType<'IgnoreMultipleBodiesFilter'>;
export type ShapeFilter = JoltInstanceType<'ShapeFilter'>;
export type ShapeFilterJS = JoltInstanceType<'ShapeFilterJS'>;
export type ShapeFilterJS2 = JoltInstanceType<'ShapeFilterJS2'>;
export type SimShapeFilter = JoltInstanceType<'SimShapeFilter'>;
export type SimShapeFilterJS = JoltInstanceType<'SimShapeFilterJS'>;

// ============================================================================
// Vehicle Types
// ============================================================================

export type VehicleConstraint = JoltInstanceType<'VehicleConstraint'>;
export type VehicleConstraintSettings =
  JoltInstanceType<'VehicleConstraintSettings'>;
export type VehicleConstraintStepListener =
  JoltInstanceType<'VehicleConstraintStepListener'>;
export type VehicleCollisionTester = JoltInstanceType<'VehicleCollisionTester'>;
export type VehicleCollisionTesterRay =
  JoltInstanceType<'VehicleCollisionTesterRay'>;
export type VehicleCollisionTesterCastSphere =
  JoltInstanceType<'VehicleCollisionTesterCastSphere'>;
export type VehicleCollisionTesterCastCylinder =
  JoltInstanceType<'VehicleCollisionTesterCastCylinder'>;
export type VehicleConstraintCallbacksEm =
  JoltInstanceType<'VehicleConstraintCallbacksEm'>;
export type VehicleConstraintCallbacksJS =
  JoltInstanceType<'VehicleConstraintCallbacksJS'>;
export type TireMaxImpulseCallbackResult =
  JoltInstanceType<'TireMaxImpulseCallbackResult'>;
export type WheeledVehicleControllerCallbacksEm =
  JoltInstanceType<'WheeledVehicleControllerCallbacksEm'>;
export type WheeledVehicleControllerCallbacksJS =
  JoltInstanceType<'WheeledVehicleControllerCallbacksJS'>;
export type WheelSettings = JoltInstanceType<'WheelSettings'>;
export type VehicleAntiRollBar = JoltInstanceType<'VehicleAntiRollBar'>;
export type Wheel = JoltInstanceType<'Wheel'>;
export type WheelSettingsWV = JoltInstanceType<'WheelSettingsWV'>;
export type WheelWV = JoltInstanceType<'WheelWV'>;
export type WheelSettingsTV = JoltInstanceType<'WheelSettingsTV'>;
export type WheelTV = JoltInstanceType<'WheelTV'>;
export type VehicleTrackSettings = JoltInstanceType<'VehicleTrackSettings'>;
export type VehicleTrack = JoltInstanceType<'VehicleTrack'>;
export type WheeledVehicleControllerSettings =
  JoltInstanceType<'WheeledVehicleControllerSettings'>;
export type TrackedVehicleControllerSettings =
  JoltInstanceType<'TrackedVehicleControllerSettings'>;
export type TrackedVehicleController =
  JoltInstanceType<'TrackedVehicleController'>;
export type VehicleEngineSettings = JoltInstanceType<'VehicleEngineSettings'>;
export type VehicleEngine = JoltInstanceType<'VehicleEngine'>;
export type VehicleTransmissionSettings =
  JoltInstanceType<'VehicleTransmissionSettings'>;
export type VehicleTransmission = JoltInstanceType<'VehicleTransmission'>;
export type VehicleDifferentialSettings =
  JoltInstanceType<'VehicleDifferentialSettings'>;
export type VehicleControllerSettings =
  JoltInstanceType<'VehicleControllerSettings'>;
export type VehicleController = JoltInstanceType<'VehicleController'>;
export type WheeledVehicleController =
  JoltInstanceType<'WheeledVehicleController'>;

// ============================================================================
// Curve Types
// ============================================================================

export type LinearCurve = JoltInstanceType<'LinearCurve'>;

// ============================================================================
// Enum Types
// ============================================================================

// Note: Enum types are represented as numbers in the Jolt module
// These are the actual enum value types from the module
export type EMotionType = number; // Enum values: EMotionType_Static, EMotionType_Kinematic, EMotionType_Dynamic
export type EBodyType = number; // Enum values: EBodyType_RigidBody, EBodyType_SoftBody
export type EMotionQuality = number; // Enum values: EMotionQuality_Discrete, EMotionQuality_LinearCast
export type EActivation = number; // Enum values: EActivation_Activate, EActivation_DontActivate
export type EShapeType = number; // Enum values: EShapeType_Convex, EShapeType_Compound, etc.
export type EShapeSubType = number; // Enum values: EShapeSubType_Sphere, EShapeSubType_Box, etc.
export type EConstraintSpace = number; // Enum values: EConstraintSpace_LocalToBodyCOM, EConstraintSpace_WorldSpace
export type ESpringMode = number; // Enum values: ESpringMode_FrequencyAndDamping, ESpringMode_StiffnessAndDamping
export type EOverrideMassProperties = number; // Enum values: EOverrideMassProperties_CalculateMassAndInertia, etc.
export type EAllowedDOFs = number; // Enum values: EAllowedDOFs_TranslationX, etc.
export type EStateRecorderState = number; // Enum values: EStateRecorderState_None, etc.
export type EBackFaceMode = number; // Enum values: EBackFaceMode_IgnoreBackFaces, etc.
export type EGroundState = number; // Enum values: EGroundState_OnGround, etc.
export type ValidateResult = number; // Enum values: ValidateResult_AcceptAllContactsForThisBodyPair, etc.
export type SoftBodyValidateResult = number; // Enum values: SoftBodyValidateResult_AcceptContact, etc.
export type EActiveEdgeMode = number; // Enum values: EActiveEdgeMode_CollideOnlyWithActive, etc.
export type ECollectFacesMode = number; // Enum values: ECollectFacesMode_CollectFaces, etc.
export type SixDOFConstraintSettings_EAxis = number; // Enum values: SixDOFConstraintSettings_EAxis_TranslationX, etc.
export type EConstraintType = number; // Enum values: EConstraintType_Constraint, etc.
export type EConstraintSubType = number; // Enum values: EConstraintSubType_Fixed, etc.
export type EMotorState = number; // Enum values: EMotorState_Off, etc.
export type ETransmissionMode = number; // Enum values: ETransmissionMode_Auto, etc.
export type ETireFrictionDirection = number; // Enum values: ETireFrictionDirection_Longitudinal, etc.
export type ESwingType = number; // Enum values: ESwingType_Cone, etc.
export type EPathRotationConstraintType = number; // Enum values: EPathRotationConstraintType_Free, etc.
export type SoftBodySharedSettings_EBendType = number; // Enum values: SoftBodySharedSettings_EBendType_None, etc.
export type SoftBodySharedSettings_ELRAType = number; // Enum values: SoftBodySharedSettings_ELRAType_None, etc.
export type MeshShapeSettings_EBuildQuality = number; // Enum values: MeshShapeSettings_EBuildQuality_FavorRuntimePerformance, etc.
