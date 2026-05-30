import * as THREE from 'three';
import type { Vec3, RVec3, Quat, JoltModule } from '../jolt-loader';

/**
 * Utility functions for VehiclePhysicsHost Physics
 */
export class T3DPhysicsUtils {
  /**
   * Helper methods for random value generation
   */
  static randomScalar(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  static randomVec3(Jolt: JoltModule, min: number, max: number): Vec3 {
    return new Jolt.Vec3(
      T3DPhysicsUtils.randomScalar(min, max),
      T3DPhysicsUtils.randomScalar(min, max),
      T3DPhysicsUtils.randomScalar(min, max)
    );
  }

  static randomRVec3(Jolt: JoltModule, min: number, max: number): RVec3 {
    return new Jolt.RVec3(
      T3DPhysicsUtils.randomScalar(min, max),
      T3DPhysicsUtils.randomScalar(min, max),
      T3DPhysicsUtils.randomScalar(min, max)
    );
  }

  static randomQuat(Jolt: JoltModule): Quat {
    return T3DPhysicsUtils.getRandomQuat(Jolt);
  }

  static wrapVec3(v: Vec3 | RVec3): THREE.Vector3 {
    return new THREE.Vector3(v.GetX(), v.GetY(), v.GetZ());
  }

  static wrapRVec3(v: RVec3): THREE.Vector3 {
    return T3DPhysicsUtils.wrapVec3(v);
  }

  static wrapQuat(q: Quat): THREE.Quaternion {
    return new THREE.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
  }

  static unwrapVec3(Jolt: JoltModule, v: THREE.Vector3): Vec3 {
    return new Jolt.Vec3(v.x, v.y, v.z);
  }

  static unwrapRVec3(Jolt: JoltModule, v: THREE.Vector3): RVec3 {
    return new Jolt.RVec3(v.x, v.y, v.z);
  }

  static unwrapQuat(Jolt: JoltModule, q: THREE.Quaternion): Quat {
    return new Jolt.Quat(q.x, q.y, q.z, q.w);
  }

  static getRandomQuat(Jolt: JoltModule): Quat {
    // Step 1: Create random vector for rotation axis
    const vec = new Jolt.Vec3(
      0.001 + Math.random(),
      Math.random(),
      Math.random()
    );

    // Step 2: Create quaternion from normalized axis and random angle
    const quat = Jolt.Quat.prototype.sRotation(
      vec.Normalized(),
      2 * Math.PI * Math.random()
    );

    // Step 3: Cleanup temporary vector
    Jolt.destroy(vec);
    return quat;
  }
}
