import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";

export type AnimationLabTwinMappingSnapshot = {
  schema: "bitstream.animation-lab.twin-mapping";
  version: 1;
  /** `componentId::signalKey` → live source key; `null` = force simulated (ignore metadata). */
  signalLiveSourceByKey: Record<string, string | null>;
  /** Which twin signal drives the 3D card primary row. */
  cardPrimaryByComponent: Record<string, string>;
};

export const EMPTY_TWIN_MAPPING_SNAPSHOT: AnimationLabTwinMappingSnapshot = {
  schema: "bitstream.animation-lab.twin-mapping",
  version: 1,
  signalLiveSourceByKey: {},
  cardPrimaryByComponent: {},
};

function storageKey(scopeKey: string): string {
  const safe = scopeKey.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return `${ANIMATION_LAB_STORAGE_PREFIX}:twin-mapping:${safe}`;
}

export function readAnimationLabTwinMapping(scopeKey: string): AnimationLabTwinMappingSnapshot {
  if (typeof window === "undefined" || scopeKey.length === 0) {
    return { ...EMPTY_TWIN_MAPPING_SNAPSHOT, signalLiveSourceByKey: {}, cardPrimaryByComponent: {} };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(scopeKey));
    if (raw == null || raw.length === 0) {
      return { ...EMPTY_TWIN_MAPPING_SNAPSHOT, signalLiveSourceByKey: {}, cardPrimaryByComponent: {} };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...EMPTY_TWIN_MAPPING_SNAPSHOT, signalLiveSourceByKey: {}, cardPrimaryByComponent: {} };
    }
    const record = parsed as Record<string, unknown>;
    return {
      schema: "bitstream.animation-lab.twin-mapping",
      version: 1,
      signalLiveSourceByKey:
        record.signalLiveSourceByKey != null && typeof record.signalLiveSourceByKey === "object"
          ? (record.signalLiveSourceByKey as Record<string, string | null>)
          : {},
      cardPrimaryByComponent:
        record.cardPrimaryByComponent != null && typeof record.cardPrimaryByComponent === "object"
          ? (record.cardPrimaryByComponent as Record<string, string>)
          : {},
    };
  } catch {
    return { ...EMPTY_TWIN_MAPPING_SNAPSHOT, signalLiveSourceByKey: {}, cardPrimaryByComponent: {} };
  }
}

export function persistAnimationLabTwinMapping(
  scopeKey: string,
  snapshot: AnimationLabTwinMappingSnapshot,
): void {
  if (typeof window === "undefined" || scopeKey.length === 0) {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(snapshot));
  } catch {
    // ignore quota
  }
}
