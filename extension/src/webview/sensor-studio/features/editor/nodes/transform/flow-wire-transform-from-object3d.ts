import type * as THREE from "three";
import type { FlowWireTransformV1 } from "./flow-wire-transform";

/** Read a mesh / group local transform into a serializable flow wire (editor degrees). */
export function flowWireTransformFromObject3D(obj: THREE.Object3D): FlowWireTransformV1 {
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  return {
    version: 1,
    position: {
      x: obj.position.x,
      y: obj.position.y,
      z: obj.position.z,
    },
    rotationDeg: {
      x: toDeg(obj.rotation.x),
      y: toDeg(obj.rotation.y),
      z: toDeg(obj.rotation.z),
    },
    scale: {
      x: obj.scale.x,
      y: obj.scale.y,
      z: obj.scale.z,
    },
  };
}
