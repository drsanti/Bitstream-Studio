import {
  flowWireTransformFromNodeDefaultConfig,
  type FlowWireTransformV1,
} from "../transform/flow-wire-transform";
import { readPartSpinPath } from "./part-spin-config";

export const GLB_PART_TRANSFORM_NODE_ID = "glb-part-transform" as const;

/** Resolve bound GLB part path from extract tag or explicit ref. */
export function readGlbPartTransformPath(
  config: Record<string, unknown> | null | undefined,
): string {
  return readPartSpinPath(config);
}

export function readGlbPartTransformFromConfig(
  config: Record<string, unknown> | null | undefined,
): FlowWireTransformV1 {
  return flowWireTransformFromNodeDefaultConfig(config ?? {});
}

export function glbPartTransformFieldsForNodeConfigPatch(
  transform: FlowWireTransformV1,
): Record<string, unknown> {
  return {
    version: transform.version,
    position: transform.position,
    rotationDeg: transform.rotationDeg,
    scale: transform.scale,
  };
}
