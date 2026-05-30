/**
 * T3DBodyCreator.ts
 *
 * April 20, 2025
 *
 * Asst.Prof.Dr.Santi Nuratch
 */
import * as THREE from 'three';

import type {
  RVec3,
  Quat,
  EMotionType,
  Body,
  Shape,
  MutableCompoundShape,
} from '../jolt-loader';

import {
  CreateBoxShapeParams,
  CreateCapsuleShapeParams,
  CreateConvexHullShapeParams,
  CreateCylinderShapeParams,
  CreateMeshShapeParams,
  CreateMutableCompoundCapsuleSphereShapesParams,
  CreateSphereShapeParams,
  CreateStaticCompoundCapsuleSphereShapesParams,
  CreateTaperedCapsuleShapeParams,
  CreateTaperedCylinderShapeParams,
  T3DShapeCreator,
  Config,
} from './T3DShapeCreator';

import { T3DPhysics, LAYER_MOVING } from '../T3DPhysics';

export interface BodyDebugParams {
  color?: number;
}
export interface GraphicsParams {
  mesh?: THREE.Mesh | THREE.Group;
}

export interface CreateBodyParams {
  position?: RVec3;
  rotation?: Quat;
  motionType?: EMotionType; // EMotionType_Static | EMotionType_Kinematic | EMotionType_Dynamic
  layerIndex?: number;
  restitution?: number; // bouncing factor (0..1)
  friction?: number; // translational motion (0..1)
  angularDamping?: number; //rotational motion (0..1)
  debugParams?: BodyDebugParams;
  graphicsParams?: GraphicsParams;
}

export interface CreateBoxBodyParams {
  shapeParams?: CreateBoxShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateCapsuleBodyParams {
  shapeParams?: CreateCapsuleShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateSphereBodyParams {
  shapeParams?: CreateSphereShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateCylinderBodyParams {
  shapeParams?: CreateCylinderShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateConvexHullBodyParams {
  shapeParams?: CreateConvexHullShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateTaperedCapsuleBodyParams {
  shapeParams?: CreateTaperedCapsuleShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateTaperedCylinderBodyParams {
  shapeParams?: CreateTaperedCylinderShapeParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateStaticCompoundBodyParams {
  shapeParams?: CreateStaticCompoundCapsuleSphereShapesParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateMutableCompoundBodyParams {
  shapeParams?: CreateMutableCompoundCapsuleSphereShapesParams;
  bodyParams?: CreateBodyParams;
}

export interface CreateMeshBodyParams {
  shapeParams?: CreateMeshShapeParams;
  bodyParams?: CreateBodyParams;
}

export class T3DBodyCreator extends T3DShapeCreator {
  constructor(physics: T3DPhysics) {
    super(physics);
  }

  private _skySpawnEnabled = false;
  private _skySpawnPosition?: RVec3;
  private _skySpawnHeight = 20;
  private _skySpawnRadius = 10;

  public setSkySpawnEnabled(enabled: boolean) {
    this._skySpawnEnabled = enabled;
    return this;
  }

  public setSkySpawnProperties(height: number, radius: number) {
    this._skySpawnHeight = height;
    this._skySpawnRadius = radius;
    return this;
  }

  private _gaussianRandom(mean = 0, stddev = 1) {
    const u = 1 - Math.random(); // Avoid 0
    const v = 1 - Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stddev + mean;
  }

  private _getSkySpawnPositionGaussian(): RVec3 {
    // Step 1: Generate random X and Z positions using Gaussian distribution
    const x = this._gaussianRandom(0, this._skySpawnRadius);
    const z = this._gaussianRandom(0, this._skySpawnRadius);

    // Step 2: Generate random Y position (height) with Gaussian distribution
    const y =
      this._skySpawnHeight +
      Math.abs(this._gaussianRandom(0, this._skySpawnHeight / 2));

    // Step 3: Initialize position object if it doesn't exist
    if (!this._skySpawnPosition) {
      this._skySpawnPosition = new this.Jolt.RVec3(0, 0, 0);
    }

    // Step 4: Set the generated position values
    this._skySpawnPosition.Set(x, y, z);
    return this._skySpawnPosition;
  }

  public createBodyFromShape(shape: Shape, params?: CreateBodyParams): Body {
    // Step 1: Track which objects we created (need to destroy them later)
    const createdPosition = !params?.position;
    const createdRotation = !params?.rotation;

    // Step 2: Extract parameters with defaults if not provided
    const {
      position = this.Jolt.RVec3.prototype.sZero(),
      rotation = this.Jolt.Quat.prototype.sIdentity(),
      motionType = this.Jolt.EMotionType_Dynamic,
      layerIndex = LAYER_MOVING,
      restitution = 0.5,
      friction = 0.5,
      angularDamping = 0.5,
    } = params ?? {};

    // Step 3: Create body creation settings (defines the properties of the body to be created)
    const creationSettings = new this.Jolt.BodyCreationSettings(
      shape,
      position,
      rotation,
      motionType,
      layerIndex
    );

    // Step 4: Configure body physical properties
    // Step 4.1: Set restitution (determines the bounciness of the body, 0..1)
    creationSettings.mRestitution = restitution;

    // Step 4.2: Set friction (controls the resistance to translational motion, 0..1)
    creationSettings.mFriction = friction;

    // Step 4.3: Set angular damping (controls the resistance to rotational motion, 0..1)
    creationSettings.mAngularDamping = angularDamping;

    // Step 5: Create the body using the physics body interface
    const body: Body = this.physics
      .getBodyInterface()
      .CreateBody(creationSettings);

    // Step 6: Apply sky spawn position if enabled
    if (this._skySpawnEnabled) {
      this.physics
        .getBodyInterface()
        .SetPosition(
          body.GetID(),
          this._getSkySpawnPositionGaussian(),
          this.Jolt.EActivation_Activate
        );
    }

    // Step 7: Clean up temporary objects
    if (createdPosition) this.Jolt.destroy(position);
    if (createdRotation) this.Jolt.destroy(rotation);
    this.Jolt.destroy(creationSettings);

    // Step 8: Return the created body
    return body;
  }

  public createBoxBody(params?: CreateBoxBodyParams): Body {
    return this.createBodyFromShape(
      this.createBoxShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createSphereBody(params?: CreateSphereBodyParams): Body {
    return this.createBodyFromShape(
      this.createSphereShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createCapsuleBody(params?: CreateCapsuleBodyParams): Body {
    return this.createBodyFromShape(
      this.createCapsuleShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createCylinderBody(params?: CreateCylinderBodyParams): Body {
    return this.createBodyFromShape(
      this.createCylinderShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createConvexHullBody(params?: CreateConvexHullBodyParams): Body {
    return this.createBodyFromShape(
      this.createConvexHullShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createTaperedCapsuleBody(
    params?: CreateTaperedCapsuleBodyParams
  ): Body {
    return this.createBodyFromShape(
      this.createTaperedCapsuleShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createTaperedCylinderBody(
    params?: CreateTaperedCylinderBodyParams
  ): Body {
    return this.createBodyFromShape(
      this.createTaperedCylinderShape(params?.shapeParams),
      params?.bodyParams
    );
  }

  public createStaticCompoundBody(
    params?: CreateStaticCompoundBodyParams
  ): Body {
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

    // 🏗️ Final shape: Create the compound shape from the settings.
    const shape = this.createStaticCompoundShape(params?.shapeParams);

    return this.createBodyFromShape(shape, params?.bodyParams);
  }

  public createMutableCompoundBody(params?: CreateMutableCompoundBodyParams): {
    mutableBody: Body;
    mutableShape: MutableCompoundShape;
  } {
    /**
     * +--------+                +--------+
     * |        +----------------+        |
     * |  HEAD  |      BODY      |  TAIL  |
     * |        +----------------+        |
     * +--------+                +--------+
     *   Sphere      Capsule         Box
     *
     * 📝 The Body (Capsule) will be rotated 90 degrees along the z-axis to align horizontally,
     *    creating a compound shape that resembles a head-body-tail structure.
     */

    // Step 1: Create mutable compound shape settings
    const compoundShapeSettings = new this.Jolt.MutableCompoundShapeSettings();

    // Step 2: Create shape settings for each sub-shape
    // Step 2.1: Create capsule (Body) shape settings
    const capsuleHalfLength = this.randomHalfHeight();
    const capsuleRadius = (capsuleHalfLength * (1 + Math.random())) / 4;
    const capsuleShapeSettings = new this.Jolt.CapsuleShapeSettings(
      capsuleHalfLength,
      capsuleRadius
    );

    // Step 2.2: Create sphere (Head) shape settings
    const sphereRadius = this.randomRadius();
    const sphereShapeSettings = new this.Jolt.SphereShapeSettings(sphereRadius);

    // Step 2.3: Create box (Tail) shape settings
    const cubeHalfExtent = this.randomHalfExtent();
    const cubeShapeSettings = new this.Jolt.BoxShapeSettings(
      cubeHalfExtent,
      Config.covexRadius
    );

    // Step 3: Define positions for each sub-shape
    // Step 3.1: Capsule (Body) position at center
    const capsulePosition = new this.Jolt.Vec3(0, 0, 0);

    // Step 3.2: Sphere (Head) position to the left
    const spherePosition = new this.Jolt.Vec3(
      -(capsuleHalfLength + sphereRadius + capsuleRadius),
      0,
      0
    );

    // Step 3.3: Box (Tail) position to the right
    const cubePosition = new this.Jolt.Vec3(
      capsuleHalfLength + cubeHalfExtent.GetX() + capsuleRadius,
      0,
      0
    );

    // Step 4: Define rotations for each sub-shape
    // Step 4.1: Capsule rotation (90 degrees along z-axis to align horizontally)
    const cylinderRotationAxis = new this.Jolt.Vec3(0, 0, 1);
    const cylinderQuaternion = this.Jolt.Quat.prototype.sRotation(
      cylinderRotationAxis,
      0.5 * Math.PI
    );

    // Step 4.2: No rotation for head and tail
    const noRotation = this.Jolt.Quat.prototype.sIdentity();

    // Step 5: Add sub-shapes to compound shape
    // Step 5.1: Add sphere (Head) shape
    compoundShapeSettings.AddShape(
      spherePosition,
      noRotation,
      sphereShapeSettings,
      0
    );

    // Step 5.2: Add box (Tail) shape
    compoundShapeSettings.AddShape(
      cubePosition,
      noRotation,
      cubeShapeSettings,
      0
    );

    // Step 5.3: Add capsule (Body) shape
    compoundShapeSettings.AddShape(
      capsulePosition,
      cylinderQuaternion,
      capsuleShapeSettings,
      0
    );

    // Step 6: Create the compound shape from settings
    const shape = compoundShapeSettings.Create().Get();

    // Step 7: Cast to mutable compound shape (KEY STEP)
    const mutableShape = this.Jolt.castObject(
      shape,
      this.Jolt.MutableCompoundShape
    );

    // Step 8: Create body from the mutable shape
    const mutableBody = this.createBodyFromShape(
      mutableShape,
      params?.bodyParams
    );

    // Step 9: Cleanup temporary objects
    this.Jolt.destroy(cubeHalfExtent);
    this.Jolt.destroy(spherePosition);
    this.Jolt.destroy(cubePosition);
    this.Jolt.destroy(capsulePosition);
    this.Jolt.destroy(sphereShapeSettings);
    this.Jolt.destroy(cubeShapeSettings);
    this.Jolt.destroy(capsuleShapeSettings);
    this.Jolt.destroy(cylinderRotationAxis);
    // Note: Don't destroy compoundShapeSettings here - it's owned by the shape

    return { mutableBody, mutableShape };
  }

  public createMeshBody(params?: CreateMeshBodyParams): Body {
    return this.createBodyFromShape(
      this.createMeshShape(params?.shapeParams),
      params?.bodyParams
    );
  }
}
