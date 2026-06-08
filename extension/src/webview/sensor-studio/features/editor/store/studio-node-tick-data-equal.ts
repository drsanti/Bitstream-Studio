import type { StudioNodeData } from "./flow-editor.store";

function shallowRecordEqual(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return a === b;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

function numberArrayEqual(
  a: readonly number[] | undefined,
  b: readonly number[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return a === b;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function plotHistoryEqual(
  a: Record<string, number[]> | undefined,
  b: Record<string, number[]> | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return a === b;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (!numberArrayEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

function wireSnapshotEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return a === b;
  }
  if (typeof a !== "object" || typeof b !== "object") {
    return Object.is(a, b);
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * True when tick-derived runtime fields on `next` match `prev` (ignores `lastUpdatedAt`).
 * Used to preserve node references and skip Zustand updates when a tick is a no-op.
 */
export function isStudioNodeTickRuntimeEqual(
  prev: StudioNodeData,
  next: StudioNodeData,
): boolean {
  if (prev.liveValue !== next.liveValue) {
    return false;
  }
  if (!numberArrayEqual(prev.liveHistory, next.liveHistory)) {
    return false;
  }
  if (!plotHistoryEqual(prev.livePlotHistory, next.livePlotHistory)) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveNumberByHandle as Record<string, unknown> | undefined,
      next.liveNumberByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveBooleanByHandle as Record<string, unknown> | undefined,
      next.liveBooleanByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveStringByHandle as Record<string, unknown> | undefined,
      next.liveStringByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveInputNumberByHandle as Record<string, unknown> | undefined,
      next.liveInputNumberByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveInputBooleanByHandle as Record<string, unknown> | undefined,
      next.liveInputBooleanByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (
    !shallowRecordEqual(
      prev.liveInputStringByHandle as Record<string, unknown> | undefined,
      next.liveInputStringByHandle as Record<string, unknown> | undefined,
    )
  ) {
    return false;
  }
  if (prev.sensorStreamMode !== next.sensorStreamMode) {
    return false;
  }
  if (prev.sensorHealth !== next.sensorHealth) {
    return false;
  }
  if (prev.sensorInvalidReason !== next.sensorInvalidReason) {
    return false;
  }
  if (prev.flowEventLastFiredAtMs !== next.flowEventLastFiredAtMs) {
    return false;
  }
  if (prev.liveSettingsExposure !== next.liveSettingsExposure) {
    return false;
  }

  const wireFields: (keyof StudioNodeData)[] = [
    "liveVector3ByHandle",
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
    "liveFogWire",
    "liveStudioLightWire",
    "livePostProcessingWire",
    "liveContactShadowsWire",
    "liveParticleEmitterWire",
    "liveMaterialWire",
    "liveMeshWire",
  ];
  for (const field of wireFields) {
    if (!wireSnapshotEqual(prev[field], next[field])) {
      return false;
    }
  }

  return true;
}
