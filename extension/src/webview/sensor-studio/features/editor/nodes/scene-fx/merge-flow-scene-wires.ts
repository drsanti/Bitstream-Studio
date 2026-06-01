import type { Scene3DConfigV1 } from "../rotation/scene3d-config";
import {
  mergeFlowWireContactShadowsIntoScene3d,
  type FlowWireContactShadowsV1,
} from "./flow-wire-contact-shadows";
import { mergeFlowWireFogIntoScene3d, type FlowWireFogV1 } from "./flow-wire-fog";
import {
  mergeFlowWirePostProcessingIntoScene3d,
  type FlowWirePostProcessingV1,
} from "./flow-wire-post-processing";
import {
  mergeFlowSceneSettingsExposureIntoScene3d,
  mergeFlowWireStudioLightIntoScene3d,
  type FlowWireStudioLightV1,
} from "./flow-wire-studio-light";

export type FlowSceneWireMergeArgs = {
  fog?: FlowWireFogV1 | null;
  exposure?: number | null;
  studioLight?: FlowWireStudioLightV1 | null;
  postProcessing?: FlowWirePostProcessingV1 | null;
  contactShadows?: FlowWireContactShadowsV1 | null;
};

/** Apply optional scene FX wires over a base `scene3d` snapshot. */
export function mergeFlowSceneWiresIntoScene3d(
  scene3d: Scene3DConfigV1,
  args: FlowSceneWireMergeArgs,
): Scene3DConfigV1 {
  let next = scene3d;
  next = mergeFlowSceneSettingsExposureIntoScene3d(next, args.exposure);
  next = mergeFlowWireFogIntoScene3d(next, args.fog);
  next = mergeFlowWireStudioLightIntoScene3d(next, args.studioLight);
  next = mergeFlowWirePostProcessingIntoScene3d(next, args.postProcessing);
  next = mergeFlowWireContactShadowsIntoScene3d(next, args.contactShadows);
  return next;
}
