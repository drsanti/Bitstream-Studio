import type { RotationPreviewSceneProps } from "../../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import type { FlowWireTransformV1 } from "./flow-wire-transform";

type TransformWireOrientationProps = Pick<
  RotationPreviewSceneProps,
  "qw" | "qx" | "qy" | "qz" | "fusionEulerHundredths" | "eulerOnly"
>;

/**
 * Model Viewer orientation from a transform wire.
 * Fusion wires use the same `eulerOnly` + hundredths path as **3D Rotation · Euler (rad)** —
 * do not pre-apply firmware GLB mapping here (StudioSceneViewport applies it once).
 */
export function rotationPreviewOrientationFromTransformWire(
  wire: FlowWireTransformV1 | null | undefined,
): TransformWireOrientationProps {
  if (wire?.eulerMapping === "fusion" && wire.fusionEulerHundredths != null) {
    return {
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      fusionEulerHundredths: wire.fusionEulerHundredths,
      eulerOnly: true,
    };
  }
  return {
    qw: 1,
    qx: 0,
    qy: 0,
    qz: 0,
    fusionEulerHundredths: null,
    eulerOnly: false,
  };
}
