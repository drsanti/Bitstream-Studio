/**
 * CubeBot Vehicle Management Class
 * Handles vehicle physics initialization, visual attachment, and cleanup
 */

import * as THREE from 'three';
import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';
import type {
  JoltModule,
  Body,
  BodyInterface,
  PhysicsSystem,
  Vec3,
  VehicleConstraint,
  WheeledVehicleController,
  VehicleConstraintStepListener,
  VehicleCollisionTester,
  VehicleCollisionTesterCastCylinder,
  VehicleCollisionTesterCastSphere,
  VehicleCollisionTesterRay,
} from '@vehicle-jolt/jolt-loader';
import { LAYER_MOVING } from '@vehicle-jolt/T3DPhysics';
import {
  VehicleProperties,
  FL_WHEEL,
  FR_WHEEL,
  BL_WHEEL,
  BR_WHEEL,
  wheelOffsetHorizontal,
  wheelOffsetVertical,
  suspensionMinLength,
  suspensionMaxLength,
  maxSteerAngle,
  fourWheelDrive,
  frontBackLimitedSlipRatio,
  leftRightLimitedSlipRatio,
  antiRollbar,
  vehicleMass,
  maxEngineTorque,
  clutchStrength,
  wheelFriction,
  vehicleBodyFriction,
  linearDamping,
  angularDamping,
  maxPitchRollAngle,
  CastType,
} from '../config/vehicleConfig';

const NUM_WHEELS = 4; // FL, FR, BL, BR
import {
  configureDebugMeshVisibility,
  setAllDebugMeshesVisibility,
  setVehicleDebugMeshVisibility as setVehicleDebugMeshVisibilityUtil,
  setPhysicsObjectsDebugMeshVisibility as setPhysicsObjectsDebugMeshVisibilityUtil,
} from '../utils/debugMeshUtils';
import { createFloor } from '../utils/floorUtils';
import { spawnBall, spawnPrank } from '../utils/ballSpawner';

export interface VehicleModels {
  floorModel?: THREE.Object3D;
  bodyModel?: THREE.Object3D;
  wheelLeftFrontModel?: THREE.Object3D; // FL_WHEEL
  wheelRightFrontModel?: THREE.Object3D; // FR_WHEEL
  wheelLeftRearModel?: THREE.Object3D; // BL_WHEEL
  wheelRightRearModel?: THREE.Object3D; // BR_WHEEL
  ballModel?: THREE.Object3D;
  prankModel?: THREE.Object3D;
}

export interface VehicleConfig {
  suspensionMinLength: number;
  suspensionMaxLength: number;
  maxSteerAngle: number;
  fourWheelDrive: boolean;
  frontBackLimitedSlipRatio: number;
  leftRightLimitedSlipRatio: number;
  antiRollbar: boolean;
  vehicleMass: number;
  maxEngineTorque: number;
  clutchStrength: number;
  wheelFriction: number;
  vehicleBodyFriction: number;
  linearDamping: number;
  angularDamping: number;
  maxPitchRollAngle: number;
  // Vehicle Properties
  bodyPositionX: number;
  bodyPositionY: number;
  bodyPositionZ: number;
  castType: CastType;
  wheelRadius: number;
  wheelWidth: number;
  halfVehicleLength: number;
  halfVehicleWidth: number;
  halfVehicleHeight: number;
}

export interface VehicleComponents {
  vehicleConstraint: VehicleConstraint;
  carBody: Body;
  controller: WheeledVehicleController;
  modelWheels: THREE.Object3D[];
  wheelRight: Vec3;
  wheelUp: Vec3;
  stepListener: VehicleConstraintStepListener;
}

export class FourWheelVehicle {
  private physics: T3DPhysics;
  private Jolt: JoltModule;
  private bodyInterface: BodyInterface;
  private physicsSystem: PhysicsSystem;
  private components: VehicleComponents | null = null;
  private wheelMaterial: THREE.MeshPhongMaterial;
  private controllerSettings: InstanceType<
    JoltModule['WheeledVehicleControllerSettings']
  > | null = null;
  private currentConfig: VehicleConfig;
  private storedModels: VehicleModels | null = null;
  private vehicleDebugMesh: THREE.Object3D | null = null;

  constructor(physics: T3DPhysics) {
    this.physics = physics;
    this.Jolt = physics.jolt;
    this.bodyInterface = physics.getBodyInterface();
    this.physicsSystem = physics.getPhysicsSystem();
    this.wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    // Initialize with default config
    this.currentConfig = {
      suspensionMinLength,
      suspensionMaxLength,
      maxSteerAngle,
      fourWheelDrive,
      frontBackLimitedSlipRatio,
      leftRightLimitedSlipRatio,
      antiRollbar,
      vehicleMass,
      maxEngineTorque,
      clutchStrength,
      wheelFriction,
      vehicleBodyFriction,
      linearDamping,
      angularDamping,
      maxPitchRollAngle,
      bodyPositionX: VehicleProperties.bodyPosition[0],
      bodyPositionY: VehicleProperties.bodyPosition[1],
      bodyPositionZ: VehicleProperties.bodyPosition[2],
      castType: VehicleProperties.castType,
      wheelRadius: VehicleProperties.wheelRadius,
      wheelWidth: VehicleProperties.wheelWidth,
      halfVehicleLength: VehicleProperties.halfVehicleLength,
      halfVehicleWidth: VehicleProperties.halfVehicleWidth,
      halfVehicleHeight: VehicleProperties.halfVehicleHeight,
    };
  }

  /**
   * Initialize the vehicle with models from GLB
   * @param models - Vehicle models from GLB
   * @param config - Vehicle configuration (optional)
   * @param skipEnvironment - If true, skip floor creation and ball spawning (for rebuilds)
   */
  async initialize(
    models: VehicleModels,
    config?: Partial<VehicleConfig>,
    skipEnvironment: boolean = false
  ): Promise<VehicleComponents> {
    // Store models for potential recreation
    this.storedModels = models;

    // Update config if provided
    if (config) {
      this.currentConfig = { ...this.currentConfig, ...config };
    }
    // Wait for physics to be initialized
    if (!this.physics.isInitialized()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!this.physics.isInitialized()) {
        throw new Error('Physics system not initialized');
      }
    }

    // Create floor (skip during rebuild)
    if (!skipEnvironment) {
      if (models.floorModel) {
        createFloor(this.physics, models.floorModel);
      } else {
        createFloor(this.physics);
      }
    }

    // Create wheel direction vectors
    const wheelRight = new this.Jolt.Vec3(0, 1, 0);
    const wheelUp = new this.Jolt.Vec3(1, 0, 0);

    // Create vehicle body
    const carBody = this.createVehicleBody(this.currentConfig);

    // Attach visual model to vehicle body
    if (models.bodyModel) {
      this.attachBodyVisualModel(carBody, models.bodyModel);
    }

    // Create vehicle constraint and wheels
    const { vehicleConstraint, controller } = this.createVehicleConstraint(
      carBody,
      this.currentConfig
    );

    // Create wheel visuals
    const modelWheels = this.createWheels(
      vehicleConstraint,
      models.wheelLeftFrontModel,
      models.wheelRightFrontModel,
      models.wheelLeftRearModel,
      models.wheelRightRearModel,
      wheelRight,
      wheelUp
    );

    // Create step listener
    const stepListener = new this.Jolt.VehicleConstraintStepListener(
      vehicleConstraint
    );
    this.physicsSystem.AddStepListener(stepListener);

    // Spawn balls (skip during rebuild)
    if (!skipEnvironment) {
      if (models.ballModel) {
        // Hide original ball model instead of removing it, so it can be reused on rebuild
        models.ballModel.visible = false;
        // Also hide all children
        models.ballModel.traverse((child) => {
          child.visible = false;
        });

        // Spawn 30 balls at random positions
        for (let i = 0; i < 30; i++) {
          spawnBall(
            models.ballModel,
            this.physics,
            this.Jolt,
            this.bodyInterface,
            i
          );
        }
      } else {
        console.warn('⚠️ Ball model named "ball" not found in GLB.');
      }

      // Spawn prank objects (skip during rebuild)
      if (models.prankModel) {
        console.log('✅ Prank model found, spawning 20 prank objects...');
        // Hide original prank model instead of removing it, so it can be reused on rebuild
        models.prankModel.visible = false;
        // Also hide all children
        models.prankModel.traverse((child) => {
          child.visible = false;
        });

        // Spawn 20 prank objects at random positions
        let spawnedCount = 0;
        for (let i = 0; i < 20; i++) {
          const body = spawnPrank(
            models.prankModel,
            this.physics,
            this.Jolt,
            this.bodyInterface,
            i
          );
          if (body) {
            spawnedCount++;
          }
        }
        console.log(`✅ Spawned ${spawnedCount} out of 20 prank objects.`);
      } else {
        console.warn('⚠️ Prank model named "prank" not found in GLB.');
      }
    }

    this.components = {
      vehicleConstraint,
      carBody,
      controller,
      modelWheels,
      wheelRight,
      wheelUp,
      stepListener,
    };

    return this.components;
  }

  /**
   * Create the vehicle physics body
   */
  private createVehicleBody(config: VehicleConfig): Body {
    const comOffset = new this.Jolt.Vec3(0, -config.halfVehicleHeight, 0);
    const boxHalfExtent = new this.Jolt.Vec3(
      config.halfVehicleWidth,
      config.halfVehicleHeight,
      config.halfVehicleLength
    );
    const boxShapeSettings = new this.Jolt.BoxShapeSettings(boxHalfExtent);
    const carShapeSettings = new this.Jolt.OffsetCenterOfMassShapeSettings(
      comOffset,
      boxShapeSettings
    );
    const carShape = carShapeSettings.Create().Get();
    this.Jolt.destroy(carShapeSettings);
    this.Jolt.destroy(comOffset);
    this.Jolt.destroy(boxHalfExtent);

    const bodyPos = new this.Jolt.RVec3(
      config.bodyPositionX,
      config.bodyPositionY,
      config.bodyPositionZ
    );
    const rotAxis = new this.Jolt.Vec3(0, 1, 0);
    const bodyRot = this.Jolt.Quat.prototype.sRotation(rotAxis, Math.PI);
    const carBodySettings = new this.Jolt.BodyCreationSettings(
      carShape,
      bodyPos,
      bodyRot,
      this.Jolt.EMotionType_Dynamic,
      LAYER_MOVING
    );
    carBodySettings.mOverrideMassProperties =
      this.Jolt.EOverrideMassProperties_CalculateInertia;
    carBodySettings.mMassPropertiesOverride.mMass = config.vehicleMass;
    carBodySettings.mFriction = config.vehicleBodyFriction;
    carBodySettings.mLinearDamping = config.linearDamping;
    carBodySettings.mAngularDamping = config.angularDamping;

    const carBody = this.bodyInterface.CreateBody(carBodySettings);

    // Set friction on the body
    this.bodyInterface.SetFriction(carBody.GetID(), config.vehicleBodyFriction);

    this.physics.registerPhysicsBody({ body: carBody });

    // Cleanup temporary objects
    this.Jolt.destroy(rotAxis);
    this.Jolt.destroy(bodyPos);
    this.Jolt.destroy(bodyRot);
    this.Jolt.destroy(carBodySettings);

    return carBody;
  }

  /**
   * Attach visual model to vehicle body
   */
  private attachBodyVisualModel(
    carBody: Body,
    bodyModel: THREE.Object3D
  ): void {
    const dynamicObjects = this.physics.getDynamicObjects();
    // Find debug mesh by matching the body (more reliable than assuming last object)
    const vehicleDynamicObj = dynamicObjects.find(
      (obj) => obj.body === carBody
    );
    const vehicleDebugMesh = vehicleDynamicObj?.debugMesh;

    // Store reference for later use
    if (vehicleDebugMesh) {
      this.vehicleDebugMesh = vehicleDebugMesh;
    }

    if (vehicleDebugMesh) {
      // Mark as vehicle debug mesh for identification
      vehicleDebugMesh.userData.debugMeshType = 'vehicle';

      // Configure debug mesh visibility
      configureDebugMeshVisibility(vehicleDebugMesh, 0.1);

      // Clone and center the body model (same as wheels - no scaling)
      if (bodyModel) {
        // Hide original body model instead of removing it, so it can be reused on rebuild
        bodyModel.visible = false;
        bodyModel.traverse((child) => {
          child.visible = false;
        });

        const bodyModelClone = bodyModel.clone();

        // Ensure cloned body and all its children are visible
        bodyModelClone.visible = true;
        bodyModelClone.traverse((child) => {
          child.visible = true;
        });

        // Center the model (same as wheels)
        const box = new THREE.Box3().setFromObject(bodyModelClone);
        const center = box.getCenter(new THREE.Vector3());
        bodyModelClone.position.sub(center);

        // Add to vehicle debug mesh
        vehicleDebugMesh.add(bodyModelClone);
      }

      // Create debug mesh for body (wireframe box matching physics dimensions)
      const bodyDebugGeometry = new THREE.BoxGeometry(
        this.currentConfig.halfVehicleWidth * 2,
        this.currentConfig.halfVehicleHeight * 2,
        this.currentConfig.halfVehicleLength * 2
      );
      const bodyDebugMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const bodyDebugMesh = new THREE.Mesh(
        bodyDebugGeometry,
        bodyDebugMaterial
      );
      // Mark as debug mesh so it can be controlled by debug visibility settings
      bodyDebugMesh.userData.isDebugMesh = true;
      // Center the debug mesh (body is at origin in local space)
      bodyDebugMesh.position.set(0, 0, 0);
      bodyDebugMesh.quaternion.set(0, 0, 0, 1);

      // Add debug mesh to vehicle debug mesh
      vehicleDebugMesh.add(bodyDebugMesh);
    }
  }

  /**
   * Create vehicle constraint with wheels
   */
  private createVehicleConstraint(
    carBody: Body,
    config: VehicleConfig
  ): {
    vehicleConstraint: VehicleConstraint;
    controller: WheeledVehicleController;
  } {
    const vehicle = new this.Jolt.VehicleConstraintSettings();
    vehicle.mMaxPitchRollAngle = config.maxPitchRollAngle;
    vehicle.mWheels.clear();

    const wheelConfigs = [
      {
        x: config.halfVehicleWidth,
        z: wheelOffsetHorizontal,
        steer: config.maxSteerAngle,
      },
      {
        x: -config.halfVehicleWidth,
        z: wheelOffsetHorizontal,
        steer: config.maxSteerAngle,
      },
      {
        x: config.halfVehicleWidth,
        z: -wheelOffsetHorizontal,
        steer: 0.0,
      },
      {
        x: -config.halfVehicleWidth,
        z: -wheelOffsetHorizontal,
        steer: 0.0,
      },
    ];

    // Track Vec3 objects for cleanup
    const wheelPositionVecs: Vec3[] = [];

    wheelConfigs.forEach((wheelConfig) => {
      const wheel = new this.Jolt.WheelSettingsWV();
      const wheelPos = new this.Jolt.Vec3(
        wheelConfig.x,
        -wheelOffsetVertical,
        wheelConfig.z
      );
      wheel.mPosition = wheelPos;
      wheelPositionVecs.push(wheelPos);
      wheel.mMaxSteerAngle = wheelConfig.steer;
      // Hand brake applies to rear wheels (non-steering wheels)
      // Set high torque value for effective braking
      wheel.mMaxHandBrakeTorque = wheelConfig.steer === 0.0 ? 10000.0 : 0.0;
      wheel.mRadius = config.wheelRadius;
      wheel.mWidth = config.wheelWidth;
      wheel.mSuspensionMinLength = config.suspensionMinLength;
      wheel.mSuspensionMaxLength = config.suspensionMaxLength;

      // Set friction curves for the wheel
      wheel.mLongitudinalFriction.Clear();
      wheel.mLongitudinalFriction.AddPoint(0.0, config.wheelFriction);
      wheel.mLongitudinalFriction.AddPoint(1.0, config.wheelFriction);

      wheel.mLateralFriction.Clear();
      wheel.mLateralFriction.AddPoint(0.0, config.wheelFriction);
      wheel.mLateralFriction.AddPoint(1.0, config.wheelFriction);

      vehicle.mWheels.push_back(wheel);
    });

    const controllerSettings = new this.Jolt.WheeledVehicleControllerSettings();
    controllerSettings.mEngine.mMaxTorque = config.maxEngineTorque;
    controllerSettings.mTransmission.mClutchStrength = config.clutchStrength;
    vehicle.mController = controllerSettings;
    // Store reference for dynamic updates
    this.controllerSettings = controllerSettings;

    controllerSettings.mDifferentials.clear();
    const frontDiff = new this.Jolt.VehicleDifferentialSettings();
    frontDiff.mLeftWheel = FL_WHEEL;
    frontDiff.mRightWheel = FR_WHEEL;
    frontDiff.mLimitedSlipRatio = config.leftRightLimitedSlipRatio;
    if (config.fourWheelDrive) frontDiff.mEngineTorqueRatio = 0.5;
    controllerSettings.mDifferentials.push_back(frontDiff);
    controllerSettings.mDifferentialLimitedSlipRatio =
      config.frontBackLimitedSlipRatio;

    if (config.fourWheelDrive) {
      const rearDiff = new this.Jolt.VehicleDifferentialSettings();
      rearDiff.mLeftWheel = BL_WHEEL;
      rearDiff.mRightWheel = BR_WHEEL;
      rearDiff.mLimitedSlipRatio = config.leftRightLimitedSlipRatio;
      rearDiff.mEngineTorqueRatio = 0.5;
      controllerSettings.mDifferentials.push_back(rearDiff);
    }

    if (config.antiRollbar) {
      vehicle.mAntiRollBars.clear();
      const frontRollBar = new this.Jolt.VehicleAntiRollBar();
      frontRollBar.mLeftWheel = FL_WHEEL;
      frontRollBar.mRightWheel = FR_WHEEL;
      const rearRollBar = new this.Jolt.VehicleAntiRollBar();
      rearRollBar.mLeftWheel = BL_WHEEL;
      rearRollBar.mRightWheel = BR_WHEEL;
      vehicle.mAntiRollBars.push_back(frontRollBar);
      vehicle.mAntiRollBars.push_back(rearRollBar);
    }

    const constraint = new this.Jolt.VehicleConstraint(carBody, vehicle);

    // Set collision tester
    let tester:
      | VehicleCollisionTester
      | VehicleCollisionTesterCastCylinder
      | VehicleCollisionTesterCastSphere
      | VehicleCollisionTesterRay;
    switch (config.castType) {
      case 'cylinder':
        tester = new this.Jolt.VehicleCollisionTesterCastCylinder(
          LAYER_MOVING,
          config.wheelRadius
        );
        break;
      case 'sphere':
        tester = new this.Jolt.VehicleCollisionTesterCastSphere(
          LAYER_MOVING,
          0.5 * config.wheelWidth
        );
        break;
      default:
        tester = new this.Jolt.VehicleCollisionTesterRay(LAYER_MOVING);
        break;
    }
    constraint.SetVehicleCollisionTester(tester);
    this.physicsSystem.AddConstraint(constraint);

    const controller = this.Jolt.castObject(
      constraint.GetController(),
      this.Jolt.WheeledVehicleController
    );

    // Cleanup temporary Vec3 objects (values have been copied into constraint)
    wheelPositionVecs.forEach((vec) => {
      this.Jolt.destroy(vec);
    });

    return { vehicleConstraint: constraint, controller };
  }

  /**
   * Create wheel visual models
   */
  private createWheels(
    constraint: VehicleConstraint,
    wheelLeftFrontModel?: THREE.Object3D,
    wheelRightFrontModel?: THREE.Object3D,
    wheelLeftRearModel?: THREE.Object3D,
    wheelRightRearModel?: THREE.Object3D,
    wheelRight?: Vec3,
    wheelUp?: Vec3,
    updateImmediately: boolean = true
  ): THREE.Object3D[] {
    const modelWheels: THREE.Object3D[] = [];

    // Use stored debug mesh reference, or find it by body if not stored
    let vehicleDebugMeshForWheels = this.vehicleDebugMesh;
    if (!vehicleDebugMeshForWheels && this.components?.carBody) {
      const dynamicObjects = this.physics.getDynamicObjects();
      const vehicleDynamicObj = dynamicObjects.find(
        (obj) => obj.body === this.components!.carBody
      );
      vehicleDebugMeshForWheels = vehicleDynamicObj?.debugMesh || null;
      if (vehicleDebugMeshForWheels) {
        this.vehicleDebugMesh = vehicleDebugMeshForWheels;
      }
    }

    if (!wheelRight || !wheelUp) {
      return modelWheels;
    }

    for (let i = 0; i < NUM_WHEELS; i++) {
      const joltWheel = constraint.GetWheel(i);
      const wheelSetting = joltWheel.GetSettings();
      let wheel: THREE.Object3D;

      // Map wheel index to specific model
      let selectedWheelModel: THREE.Object3D | undefined;
      switch (i) {
        case FL_WHEEL:
          selectedWheelModel = wheelLeftFrontModel;
          break;
        case FR_WHEEL:
          selectedWheelModel = wheelRightFrontModel;
          break;
        case BL_WHEEL:
          selectedWheelModel = wheelLeftRearModel;
          break;
        case BR_WHEEL:
          selectedWheelModel = wheelRightRearModel;
          break;
      }

      if (selectedWheelModel) {
        // Hide original wheel model instead of removing it, so it can be reused on rebuild
        selectedWheelModel.visible = false;
        selectedWheelModel.traverse((child) => {
          child.visible = false;
        });

        wheel = selectedWheelModel.clone();

        // Ensure cloned wheel and all its children are visible
        wheel.visible = true;
        wheel.traverse((child) => {
          child.visible = true;
        });

        const wheelBox = new THREE.Box3().setFromObject(wheel);
        const center = wheelBox.getCenter(new THREE.Vector3());
        wheel.position.sub(center);
      } else {
        wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(
            wheelSetting.mRadius,
            wheelSetting.mRadius,
            wheelSetting.mWidth,
            32,
            1
          ),
          this.wheelMaterial
        );
      }

      // Add update function for wheel transform
      // Store constraint reference in closure to ensure we always use the current constraint
      const constraintRef = constraint;
      const wheelIndex = i; // Capture wheel index in closure
      (wheel as any).updateLocalTransform = () => {
        if (!wheelRight || !wheelUp || !constraintRef) return;
        try {
          // Get wheel transform in local space relative to vehicle body
          const transform = constraintRef.GetWheelLocalTransform(
            wheelIndex,
            wheelRight,
            wheelUp
          );

          // Get translation and rotation from transform
          const translation = this.physics.wrapVec3(transform.GetTranslation());
          const rotation = this.physics.wrapQuat(
            transform.GetRotation().GetQuaternion()
          );

          // Set wheel position and rotation (in local space of debug mesh/body)
          wheel.position.copy(translation);
          wheel.quaternion.copy(rotation);
        } catch {
          // Constraint has been destroyed, clear the update function
          (wheel as any).updateLocalTransform = null;
        }
      };

      // Only update transform immediately if requested
      // When recreating constraint, we preserve old positions to prevent visual glitch
      if (updateImmediately) {
        (wheel as any).updateLocalTransform();
      }

      wheel.visible = true;
      vehicleDebugMeshForWheels?.add(wheel);
      modelWheels.push(wheel);

      // Create debug mesh for wheel (always create, visibility controlled by user toggle)
      const wheelDebugGeometry = new THREE.CylinderGeometry(
        wheelSetting.mRadius,
        wheelSetting.mRadius,
        wheelSetting.mWidth,
        16,
        1
      );
      const wheelDebugMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const wheelDebugMesh = new THREE.Mesh(
        wheelDebugGeometry,
        wheelDebugMaterial
      );
      // Mark as debug mesh so it can be controlled by debug visibility settings
      wheelDebugMesh.userData.isDebugMesh = true;
      wheelDebugMesh.rotateZ(Math.PI / 2);

      // Update debug mesh transform along with wheel
      const originalUpdate = (wheel as any).updateLocalTransform;
      (wheel as any).updateLocalTransform = () => {
        originalUpdate();
        if (wheelDebugMesh) {
          wheelDebugMesh.position.copy(wheel.position);
          wheelDebugMesh.quaternion.copy(wheel.quaternion);
        }
      };
      wheelDebugMesh.position.copy(wheel.position);
      wheelDebugMesh.quaternion.copy(wheel.quaternion);
      vehicleDebugMeshForWheels?.add(wheelDebugMesh);
    }

    return modelWheels;
  }

  /**
   * Get vehicle components
   */
  getComponents(): VehicleComponents | null {
    return this.components;
  }

  /**
   * Update engine torque dynamically
   * Note: This updates the settings, but may require controller recreation for full effect
   */
  updateEngineTorque(torque: number): void {
    if (!this.controllerSettings) return;
    try {
      this.controllerSettings.mEngine.mMaxTorque = torque;
      // Also try to update the running controller if possible
      if (this.components?.controller) {
        // Controller settings are copied during creation, so we update the stored settings
        // The controller will use these on next update cycle
        (this.components.controller as any).mEngine =
          this.controllerSettings.mEngine;
      }
    } catch (error) {
      console.warn('Error updating engine torque:', error);
    }
  }

  /**
   * Update clutch strength dynamically
   * Note: This updates the settings, but may require controller recreation for full effect
   */
  updateClutchStrength(strength: number): void {
    if (!this.controllerSettings) return;
    try {
      this.controllerSettings.mTransmission.mClutchStrength = strength;
      // Also try to update the running controller if possible
      if (this.components?.controller) {
        (this.components.controller as any).mTransmission =
          this.controllerSettings.mTransmission;
      }
    } catch (error) {
      console.warn('Error updating clutch strength:', error);
    }
  }

  /**
   * Update body friction dynamically
   */
  updateBodyFriction(friction: number): void {
    if (!this.components) return;
    try {
      const bodyId = this.components.carBody.GetID();
      this.bodyInterface.SetFriction(bodyId, friction);
    } catch (error) {
      console.warn('Error updating body friction:', error);
    }
  }

  /**
   * Update suspension parameters dynamically
   * Note: This requires recreating the vehicle constraint as wheel settings are immutable
   * @param suspensionMinLength - New minimum suspension length
   * @param suspensionMaxLength - New maximum suspension length
   * @returns Updated vehicle components or null if recreation failed
   */
  async updateSuspension(
    suspensionMinLength: number,
    suspensionMaxLength: number
  ): Promise<VehicleComponents | null> {
    if (!this.components || !this.storedModels) return null;

    try {
      const carBody = this.components.carBody;
      const { vehicleConstraint, stepListener, wheelRight, wheelUp } =
        this.components;

      // Save current wheel positions and rotations before cleanup
      const savedWheelTransforms: Array<{
        position: THREE.Vector3;
        quaternion: THREE.Quaternion;
      }> = [];
      this.components.modelWheels.forEach((wheel) => {
        savedWheelTransforms.push({
          position: wheel.position.clone(),
          quaternion: wheel.quaternion.clone(),
        });
      });

      // Use stored debug mesh reference, or find it by body
      let vehicleDebugMeshForWheels = this.vehicleDebugMesh;
      if (!vehicleDebugMeshForWheels) {
        const dynamicObjects = this.physics.getDynamicObjects();
        const vehicleDynamicObj = dynamicObjects.find(
          (obj) => obj.body === carBody
        );
        vehicleDebugMeshForWheels = vehicleDynamicObj?.debugMesh || null;
        if (vehicleDebugMeshForWheels) {
          this.vehicleDebugMesh = vehicleDebugMeshForWheels;
        }
      }

      // Save body state before removing constraint to prevent NaN issues
      const bodyPos = this.physics.wrapRVec3(carBody.GetPosition());
      const bodyRot = this.physics.wrapQuat(carBody.GetRotation());

      // Validate body state before proceeding
      const isValidState =
        isFinite(bodyPos.x) &&
        isFinite(bodyPos.y) &&
        isFinite(bodyPos.z) &&
        isFinite(bodyRot.x) &&
        isFinite(bodyRot.y) &&
        isFinite(bodyRot.z) &&
        isFinite(bodyRot.w);

      if (!isValidState) {
        console.error(
          'Invalid body state detected before constraint removal, aborting suspension update'
        );
        return null;
      }

      // Cleanup old constraint
      try {
        this.physicsSystem.RemoveStepListener(stepListener);
      } catch (error) {
        console.warn('Error removing step listener:', error);
      }

      try {
        this.physicsSystem.RemoveConstraint(vehicleConstraint);
      } catch (error) {
        console.warn('Error removing constraint:', error);
      }

      // Ensure body state is still valid after constraint removal
      // If body position became NaN, restore it
      const bodyPosAfter = this.physics.wrapRVec3(carBody.GetPosition());
      if (
        !isFinite(bodyPosAfter.x) ||
        !isFinite(bodyPosAfter.y) ||
        !isFinite(bodyPosAfter.z)
      ) {
        // Restore body position if it became invalid
        const restorePos = new this.Jolt.RVec3(bodyPos.x, bodyPos.y, bodyPos.z);
        this.bodyInterface.SetPosition(
          carBody.GetID(),
          restorePos,
          this.Jolt.EActivation_Activate
        );
        this.Jolt.destroy(restorePos);
      }

      // Cleanup old wheel visuals and clear their update functions
      this.components.modelWheels.forEach((wheel) => {
        if ((wheel as any).updateLocalTransform) {
          (wheel as any).updateLocalTransform = null;
        }
        if (wheel.parent) wheel.parent.remove(wheel);
      });

      // Update config with new suspension parameters
      this.currentConfig.suspensionMinLength = suspensionMinLength;
      this.currentConfig.suspensionMaxLength = suspensionMaxLength;

      // Recreate constraint with new suspension parameters
      const { vehicleConstraint: newConstraint, controller: newController } =
        this.createVehicleConstraint(carBody, this.currentConfig);

      // Recreate step listener
      const newStepListener = new this.Jolt.VehicleConstraintStepListener(
        newConstraint
      );
      this.physicsSystem.AddStepListener(newStepListener);

      // Verify we're using the correct debug mesh
      const dynamicObjectsAfter = this.physics.getDynamicObjects();
      const vehicleDynamicObjAfter = dynamicObjectsAfter.find(
        (obj) => obj.body === carBody
      );
      const vehicleDebugMeshForWheelsAfter =
        vehicleDynamicObjAfter?.debugMesh || null;

      if (vehicleDebugMeshForWheels !== vehicleDebugMeshForWheelsAfter) {
        if (vehicleDebugMeshForWheelsAfter) {
          this.vehicleDebugMesh = vehicleDebugMeshForWheelsAfter;
          vehicleDebugMeshForWheels = vehicleDebugMeshForWheelsAfter;
        }
      }

      // Recreate wheel visuals without immediate update
      const newModelWheels = this.createWheels(
        newConstraint,
        this.storedModels.wheelLeftFrontModel,
        this.storedModels.wheelRightFrontModel,
        this.storedModels.wheelLeftRearModel,
        this.storedModels.wheelRightRearModel,
        wheelRight,
        wheelUp,
        false // Don't update immediately - preserve positions
      );

      // Restore saved wheel positions to prevent visual glitch
      newModelWheels.forEach((wheel, index) => {
        if (savedWheelTransforms[index]) {
          wheel.position.copy(savedWheelTransforms[index].position);
          wheel.quaternion.copy(savedWheelTransforms[index].quaternion);
        }
      });

      // Update components
      this.components = {
        vehicleConstraint: newConstraint,
        carBody,
        controller: newController,
        modelWheels: newModelWheels,
        wheelRight,
        wheelUp,
        stepListener: newStepListener,
      };

      return this.components;
    } catch (error) {
      console.error(
        'Error recreating vehicle constraint for suspension:',
        error
      );
      return null;
    }
  }

  /**
   * Update max steer angle dynamically
   * Note: This requires recreating the vehicle constraint as wheel settings are immutable
   * @param maxSteerAngle - New max steer angle in radians
   * @returns Updated vehicle components or null if recreation failed
   */
  async updateMaxSteerAngle(
    maxSteerAngle: number
  ): Promise<VehicleComponents | null> {
    if (!this.components || !this.storedModels) return null;

    try {
      const carBody = this.components.carBody;
      const { vehicleConstraint, stepListener, wheelRight, wheelUp } =
        this.components;

      // Save current wheel positions and rotations before cleanup
      // This prevents the "jump down" effect when recreating the constraint
      const savedWheelTransforms: Array<{
        position: THREE.Vector3;
        quaternion: THREE.Quaternion;
      }> = [];
      this.components.modelWheels.forEach((wheel) => {
        savedWheelTransforms.push({
          position: wheel.position.clone(),
          quaternion: wheel.quaternion.clone(),
        });
      });

      // Use stored debug mesh reference, or find it by body
      let vehicleDebugMeshForWheels = this.vehicleDebugMesh;
      if (!vehicleDebugMeshForWheels) {
        const dynamicObjects = this.physics.getDynamicObjects();
        const vehicleDynamicObj = dynamicObjects.find(
          (obj) => obj.body === carBody
        );
        vehicleDebugMeshForWheels = vehicleDynamicObj?.debugMesh || null;
        if (vehicleDebugMeshForWheels) {
          this.vehicleDebugMesh = vehicleDebugMeshForWheels;
        }
      }

      // Save body state before removing constraint to prevent NaN issues
      const bodyPos = this.physics.wrapRVec3(carBody.GetPosition());
      const bodyRot = this.physics.wrapQuat(carBody.GetRotation());

      // Validate body state before proceeding
      const isValidState =
        isFinite(bodyPos.x) &&
        isFinite(bodyPos.y) &&
        isFinite(bodyPos.z) &&
        isFinite(bodyRot.x) &&
        isFinite(bodyRot.y) &&
        isFinite(bodyRot.z) &&
        isFinite(bodyRot.w);

      if (!isValidState) {
        console.error(
          'Invalid body state detected before constraint removal, aborting maxSteerAngle update'
        );
        return null;
      }

      // Cleanup old constraint
      try {
        this.physicsSystem.RemoveStepListener(stepListener);
      } catch (error) {
        console.warn('Error removing step listener:', error);
      }

      try {
        this.physicsSystem.RemoveConstraint(vehicleConstraint);
      } catch (error) {
        console.warn('Error removing constraint:', error);
      }

      // Ensure body state is still valid after constraint removal
      // If body position became NaN, restore it
      const bodyPosAfter = this.physics.wrapRVec3(carBody.GetPosition());
      if (
        !isFinite(bodyPosAfter.x) ||
        !isFinite(bodyPosAfter.y) ||
        !isFinite(bodyPosAfter.z)
      ) {
        // Restore body position if it became invalid
        const restorePos = new this.Jolt.RVec3(bodyPos.x, bodyPos.y, bodyPos.z);
        this.bodyInterface.SetPosition(
          carBody.GetID(),
          restorePos,
          this.Jolt.EActivation_Activate
        );
        this.Jolt.destroy(restorePos);
      }

      // Cleanup old wheel visuals and clear their update functions
      this.components.modelWheels.forEach((wheel) => {
        // Clear update function to prevent accessing destroyed constraint
        if ((wheel as any).updateLocalTransform) {
          (wheel as any).updateLocalTransform = null;
        }
        if (wheel.parent) wheel.parent.remove(wheel);
      });

      // Update config with new maxSteerAngle
      this.currentConfig.maxSteerAngle = maxSteerAngle;

      // Recreate constraint with new maxSteerAngle
      const { vehicleConstraint: newConstraint, controller: newController } =
        this.createVehicleConstraint(carBody, this.currentConfig);

      // Recreate step listener
      const newStepListener = new this.Jolt.VehicleConstraintStepListener(
        newConstraint
      );
      this.physicsSystem.AddStepListener(newStepListener);

      // Verify we're using the correct debug mesh (should be the same as before)
      const dynamicObjectsAfter = this.physics.getDynamicObjects();
      const vehicleDynamicObjAfter = dynamicObjectsAfter.find(
        (obj) => obj.body === carBody
      );
      const vehicleDebugMeshForWheelsAfter =
        vehicleDynamicObjAfter?.debugMesh || null;

      if (vehicleDebugMeshForWheels !== vehicleDebugMeshForWheelsAfter) {
        console.warn(
          'Warning: Debug mesh reference changed during constraint recreation'
        );
        // Update stored reference
        if (vehicleDebugMeshForWheelsAfter) {
          this.vehicleDebugMesh = vehicleDebugMeshForWheelsAfter;
          vehicleDebugMeshForWheels = vehicleDebugMeshForWheelsAfter;
        }
      }

      // Recreate wheel visuals
      // Note: We pass updateImmediately=false to preserve old positions and prevent visual glitch
      const newModelWheels = this.createWheels(
        newConstraint,
        this.storedModels.wheelLeftFrontModel,
        this.storedModels.wheelRightFrontModel,
        this.storedModels.wheelLeftRearModel,
        this.storedModels.wheelRightRearModel,
        wheelRight,
        wheelUp,
        false // Don't update immediately - we'll restore saved positions instead
      );

      // Restore saved wheel positions to prevent the "jump down" visual glitch
      // The physics system will smoothly update them to correct positions via frame callback
      newModelWheels.forEach((wheel, index) => {
        if (savedWheelTransforms[index]) {
          wheel.position.copy(savedWheelTransforms[index].position);
          wheel.quaternion.copy(savedWheelTransforms[index].quaternion);
        }
      });

      // Update components
      this.components = {
        vehicleConstraint: newConstraint,
        carBody,
        controller: newController,
        modelWheels: newModelWheels,
        wheelRight,
        wheelUp,
        stepListener: newStepListener,
      };

      return this.components;
    } catch (error) {
      console.error(
        'Error recreating vehicle constraint for maxSteerAngle:',
        error
      );
      return null;
    }
  }

  /**
   * Update body damping dynamically
   * Note: Jolt doesn't provide direct API for this, so we update via body properties
   */
  updateBodyDamping(linear: number, angular: number): void {
    if (!this.components) return;
    try {
      const body = this.components.carBody;
      // Update damping directly on the body if the API supports it
      // Note: This may not be available in all Jolt versions
      if ((body as any).SetLinearDamping) {
        (body as any).SetLinearDamping(linear);
      }
      if ((body as any).SetAngularDamping) {
        (body as any).SetAngularDamping(angular);
      }
    } catch (error) {
      // If direct update fails, damping changes require body recreation
      console.warn(
        'Error updating body damping (may require vehicle recreation):',
        error
      );
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    if (!this.components) return;

    const {
      vehicleConstraint,
      carBody,
      modelWheels,
      wheelRight,
      wheelUp,
      stepListener,
    } = this.components;

    // Check if physics is still valid before cleanup
    // Physics may have been disposed during scene switching
    // We check by trying to access a safe property
    let physicsValid = false;
    try {
      if (this.physics && this.physicsSystem && this.physics.isInitialized()) {
        physicsValid = true;
      }
    } catch {
      // Physics is already disposed, skip physics cleanup
      physicsValid = false;
    }

    // Only try to remove listeners/constraints if physics is still valid
    if (physicsValid) {
      // Remove step listener
      try {
        this.physicsSystem.RemoveStepListener(stepListener);
      } catch (error) {
        // Physics may have been disposed during cleanup
        // Silently handle - this is expected during scene switching
      }

      // Remove constraint
      try {
        this.physicsSystem.RemoveConstraint(vehicleConstraint);
      } catch (error) {
        // Physics may have been disposed during cleanup
        // Silently handle - this is expected during scene switching
      }
    }

    // Remove vehicle body (only if physics is still valid)
    if (physicsValid) {
      try {
        const dynamicObjects = this.physics.getDynamicObjects();
        const dynamicObj = dynamicObjects.find((obj) => obj.body === carBody);
        if (dynamicObj) {
          this.physics.removeFromScene(dynamicObj);
        } else {
          try {
            const bodyId = carBody.GetID();
            if (this.bodyInterface.IsAdded(bodyId)) {
              this.bodyInterface.RemoveBody(bodyId);
              this.bodyInterface.DestroyBody(bodyId);
            }
          } catch {
            // Body may already be disposed
          }
        }
      } catch (error) {
        // Physics may have been disposed during cleanup
        // Silently handle - this is expected during scene switching
      }
    }

    // Cleanup wheel meshes
    modelWheels.forEach((wheel) => {
      if (wheel.parent) wheel.parent.remove(wheel);
      if (wheel instanceof THREE.Mesh) {
        wheel.geometry.dispose();
        if (wheel.material instanceof THREE.Material) {
          wheel.material.dispose();
        }
      } else {
        wheel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
    });

    // Cleanup wheel direction vectors
    if (wheelRight) {
      this.Jolt.destroy(wheelRight);
    }
    if (wheelUp) {
      this.Jolt.destroy(wheelUp);
    }

    // Cleanup wheel material
    this.wheelMaterial.dispose();

    this.components = null;
  }

  /**
   * Get the vehicle debug mesh
   * @returns The vehicle debug mesh, or null if not available
   */
  getDebugMesh(): THREE.Object3D | null {
    return this.vehicleDebugMesh;
  }

  /**
   * Set debug mesh visibility for all debug meshes (vehicle, wheels, balls, etc.)
   * @param visible - Whether to show the debug meshes
   * @param opacity - Opacity for debug geometry when visible (default: 0.1)
   */
  setDebugMeshVisibility(visible: boolean, opacity: number = 0.1): void {
    // Apply visibility to all debug meshes in the physics system
    // This includes vehicle body, wheels, balls, and any other physics bodies
    setAllDebugMeshesVisibility(this.physics, visible, opacity);
  }

  /**
   * Set visibility, opacity, and color for vehicle parts debug mesh (body + wheels)
   * @param visible - Whether to show the debug mesh
   * @param opacity - Opacity for debug geometry when visible (default: 0.1)
   * @param color - Optional hex color string (e.g., "#00ff00") to apply to debug mesh materials
   */
  setVehiclePartsDebugMeshVisibility(
    visible: boolean,
    opacity: number = 0.1,
    color?: string
  ): void {
    if (!this.components?.carBody) {
      return;
    }
    setVehicleDebugMeshVisibilityUtil(
      this.physics,
      this.components.carBody,
      visible,
      opacity,
      color
    );
  }

  /**
   * Set visibility, opacity, and color for physics objects debug meshes (balls, floor, and other physics objects)
   * @param visible - Whether to show the debug meshes
   * @param opacity - Opacity for debug geometry when visible (default: 0.1)
   * @param color - Optional hex color string (e.g., "#ff0000") to apply to debug mesh materials
   */
  setPhysicsObjectsDebugMeshVisibility(
    visible: boolean,
    opacity: number = 0.1,
    color?: string
  ): void {
    setPhysicsObjectsDebugMeshVisibilityUtil(
      this.physics,
      visible,
      opacity,
      color
    );
  }
}
