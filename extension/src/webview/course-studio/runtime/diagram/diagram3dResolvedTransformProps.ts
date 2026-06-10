import type { ResolvedRotation3d } from "./evaluateDiagram3dProps";

function finiteAxis(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function sanitizeDiagram3dPosition(
  position: [number, number, number],
): [number, number, number] {
  return [
    finiteAxis(position[0], 0),
    finiteAxis(position[1], 0),
    finiteAxis(position[2], 0),
  ];
}

export function sanitizeDiagram3dScale(scale: [number, number, number]): [number, number, number] {
  return [
    finiteAxis(scale[0], 1) || 1,
    finiteAxis(scale[1], 1) || 1,
    finiteAxis(scale[2], 1) || 1,
  ];
}

export function resolvedRotationToR3fProps(rotation: ResolvedRotation3d): {
  rotation?: [number, number, number];
  quaternion?: [number, number, number, number];
} {
  if (rotation.kind === "euler") {
    return {
      rotation: [
        (finiteAxis(rotation.pitch, 0) * Math.PI) / 180,
        (finiteAxis(rotation.yaw, 0) * Math.PI) / 180,
        (finiteAxis(rotation.roll, 0) * Math.PI) / 180,
      ],
    };
  }
  if (rotation.kind === "quaternion") {
    return {
      quaternion: [
        finiteAxis(rotation.qx, 0),
        finiteAxis(rotation.qy, 0),
        finiteAxis(rotation.qz, 0),
        finiteAxis(rotation.qw, 1),
      ],
    };
  }
  return {};
}
