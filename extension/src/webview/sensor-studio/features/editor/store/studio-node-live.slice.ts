import type { StudioNodeData } from "./flow-editor.store";
import { isStudioNodeTickRuntimeEqual } from "./studio-node-tick-data-equal";

/** Runtime telemetry fields updated by `tickSimulation` — kept out of the main graph store. */
export type StudioNodeLiveSlice = {
  liveValue?: StudioNodeData["liveValue"];
  liveHistory?: number[];
  livePlotHistory?: Record<string, number[]>;
  liveNumberByHandle?: StudioNodeData["liveNumberByHandle"];
  liveBooleanByHandle?: StudioNodeData["liveBooleanByHandle"];
  liveStringByHandle?: StudioNodeData["liveStringByHandle"];
  liveInputNumberByHandle?: StudioNodeData["liveInputNumberByHandle"];
  liveInputBooleanByHandle?: StudioNodeData["liveInputBooleanByHandle"];
  liveInputStringByHandle?: StudioNodeData["liveInputStringByHandle"];
  liveInputVector3ByHandle?: StudioNodeData["liveInputVector3ByHandle"];
  liveInputScalarHintsByHandle?: StudioNodeData["liveInputScalarHintsByHandle"];
  liveQuaternionWire?: StudioNodeData["liveQuaternionWire"];
  liveVector3Wire?: StudioNodeData["liveVector3Wire"];
  liveEnvironmentWire?: StudioNodeData["liveEnvironmentWire"];
  liveDashboardThemeWire?: StudioNodeData["liveDashboardThemeWire"];
  liveCameraWire?: StudioNodeData["liveCameraWire"];
  liveVideoTextureWire?: StudioNodeData["liveVideoTextureWire"];
  liveVideoBusWire?: StudioNodeData["liveVideoBusWire"];
  liveAnimationWire?: StudioNodeData["liveAnimationWire"];
  liveTransformWire?: StudioNodeData["liveTransformWire"];
  livePhysicsWire?: StudioNodeData["livePhysicsWire"];
  liveStagePickWire?: StudioNodeData["liveStagePickWire"];
  liveSettingsExposure?: StudioNodeData["liveSettingsExposure"];
  liveFogWire?: StudioNodeData["liveFogWire"];
  liveStudioLightWire?: StudioNodeData["liveStudioLightWire"];
  livePostProcessingWire?: StudioNodeData["livePostProcessingWire"];
  liveContactShadowsWire?: StudioNodeData["liveContactShadowsWire"];
  liveParticleEmitterWire?: StudioNodeData["liveParticleEmitterWire"];
  liveMaterialWire?: StudioNodeData["liveMaterialWire"];
  liveMeshWire?: StudioNodeData["liveMeshWire"];
  sensorStreamMode?: StudioNodeData["sensorStreamMode"];
  sensorHealth?: StudioNodeData["sensorHealth"];
  sensorInvalidReason?: StudioNodeData["sensorInvalidReason"];
  sensorLastValidAtByHandle?: StudioNodeData["sensorLastValidAtByHandle"];
  sensorInvalidByHandle?: StudioNodeData["sensorInvalidByHandle"];
  flowEventLastFiredAtMs?: StudioNodeData["flowEventLastFiredAtMs"];
  lastUpdatedAt?: string;
};

const LIVE_FIELD_KEYS = [
  "liveValue",
  "liveHistory",
  "livePlotHistory",
  "liveNumberByHandle",
  "liveBooleanByHandle",
  "liveStringByHandle",
  "liveInputNumberByHandle",
  "liveInputBooleanByHandle",
  "liveInputStringByHandle",
  "liveInputVector3ByHandle",
  "liveInputScalarHintsByHandle",
  "liveQuaternionWire",
  "liveVector3Wire",
  "liveEnvironmentWire",
  "liveDashboardThemeWire",
  "liveCameraWire",
  "liveVideoTextureWire",
  "liveVideoBusWire",
  "liveAnimationWire",
  "liveTransformWire",
  "livePhysicsWire",
  "liveStagePickWire",
  "liveSettingsExposure",
  "liveFogWire",
  "liveStudioLightWire",
  "livePostProcessingWire",
  "liveContactShadowsWire",
  "liveParticleEmitterWire",
  "liveMaterialWire",
  "liveMeshWire",
  "sensorStreamMode",
  "sensorHealth",
  "sensorInvalidReason",
  "sensorLastValidAtByHandle",
  "sensorInvalidByHandle",
  "flowEventLastFiredAtMs",
  "lastUpdatedAt",
] as const satisfies readonly (keyof StudioNodeLiveSlice)[];

export function extractStudioNodeLiveSlice(data: StudioNodeData): StudioNodeLiveSlice {
  const slice: StudioNodeLiveSlice = {};
  for (const key of LIVE_FIELD_KEYS) {
    const value = data[key];
    if (value !== undefined) {
      (slice as Record<string, unknown>)[key] = value;
    }
  }
  return slice;
}

export function mergeStudioNodeLiveIntoData(
  data: StudioNodeData,
  live: StudioNodeLiveSlice | undefined,
): StudioNodeData {
  if (live == null) {
    return data;
  }
  return {
    ...data,
    ...live,
  };
}

export function isStudioNodeLiveSliceEqual(
  a: StudioNodeLiveSlice | undefined,
  b: StudioNodeLiveSlice | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  const mergedA = mergeStudioNodeLiveIntoData({} as StudioNodeData, a);
  const mergedB = mergeStudioNodeLiveIntoData({} as StudioNodeData, b);
  return isStudioNodeTickRuntimeEqual(mergedA, mergedB);
}

export function readStudioNodeConfigRevision(data: StudioNodeData): string {
  return JSON.stringify({
    nodeId: data.nodeId,
    label: data.label,
    defaultConfig: data.defaultConfig,
    ui: data.ui,
    inputType: data.inputType,
    outputType: data.outputType,
    outputHandles: data.outputHandles,
    inputHandles: data.inputHandles,
  });
}
