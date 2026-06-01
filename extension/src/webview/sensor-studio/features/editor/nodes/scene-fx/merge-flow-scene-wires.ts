import type { Scene3DConfigV1 } from "../rotation/scene3d-config";
import { mergeFlowWireFogIntoScene3d, type FlowWireFogV1 } from "./flow-wire-fog";
import {
  mergeFlowSceneSettingsExposureIntoScene3d,
  mergeFlowWireStudioLightIntoScene3d,
  type FlowWireStudioLightV1,
} from "./flow-wire-studio-light";

export type FlowSceneWireMergeArgs = {
  fog?: FlowWireFogV1 | null;
  exposure?: number | null;
  studioLight?: FlowWireStudioLightV1 | null;
};

/** Apply optional fog / exposure / studio-light wires over a base `scene3d` snapshot. */
export function mergeFlowSceneWiresIntoScene3d(
  scene3d: Scene3DConfigV1,
  args: FlowSceneWireMergeArgs,
): Scene3DConfigV1 {
  let next = scene3d;
  next = mergeFlowSceneSettingsExposureIntoScene3d(next, args.exposure);
  next = mergeFlowWireFogIntoScene3d(next, args.fog);
  next = mergeFlowWireStudioLightIntoScene3d(next, args.studioLight);
  return next;
}
