import { create } from "zustand";
import {
  composeTwinLiveSourceKey,
  decomposeTwinLiveSourceKey,
  resolveEffectiveTwinLiveSourceKey,
  TWIN_MAPPING_SENSOR_NONE,
  twinMappingSignalKey,
  type TwinMappingSensorId,
} from "./animation-lab-twin-mapping-catalog.js";
import {
  persistAnimationLabTwinMapping,
  readAnimationLabTwinMapping,
  type AnimationLabTwinMappingSnapshot,
} from "./animation-lab-twin-mapping.persistence.js";

type AnimationLabTwinMappingStoreState = {
  scopeKey: string;
  signalLiveSourceByKey: Record<string, string | null>;
  cardPrimaryByComponent: Record<string, string>;
  loadScope: (scopeKey: string) => void;
  setSignalMapping: (
    componentId: string,
    signalKey: string,
    sensor: TwinMappingSensorId,
    subParam: string,
  ) => void;
  setCardPrimary: (componentId: string, signalKey: string) => void;
  resetSignalMapping: (componentId: string, signalKey: string) => void;
  resetComponentMappings: (componentId: string) => void;
  resetAllMappings: () => void;
  snapshot: () => AnimationLabTwinMappingSnapshot;
};

function persistScope(scopeKey: string, state: AnimationLabTwinMappingStoreState): void {
  if (scopeKey.length === 0) {
    return;
  }
  persistAnimationLabTwinMapping(scopeKey, {
    schema: "bitstream.animation-lab.twin-mapping",
    version: 1,
    signalLiveSourceByKey: state.signalLiveSourceByKey,
    cardPrimaryByComponent: state.cardPrimaryByComponent,
  });
}

export const useAnimationLabTwinMappingStore = create<AnimationLabTwinMappingStoreState>(
  (set, get) => ({
    scopeKey: "",
    signalLiveSourceByKey: {},
    cardPrimaryByComponent: {},
    loadScope: (scopeKey) => {
      const trimmed = scopeKey.trim();
      if (trimmed.length === 0) {
        set({ scopeKey: "", signalLiveSourceByKey: {}, cardPrimaryByComponent: {} });
        return;
      }
      const snapshot = readAnimationLabTwinMapping(trimmed);
      set({
        scopeKey: trimmed,
        signalLiveSourceByKey: snapshot.signalLiveSourceByKey,
        cardPrimaryByComponent: snapshot.cardPrimaryByComponent,
      });
    },
    setSignalMapping: (componentId, signalKey, sensor, subParam) => {
      const mapKey = twinMappingSignalKey(componentId, signalKey);
      const composed = composeTwinLiveSourceKey(sensor, subParam);
      set((state) => {
        const signalLiveSourceByKey = { ...state.signalLiveSourceByKey };
        if (composed == null) {
          signalLiveSourceByKey[mapKey] = null;
        } else {
          signalLiveSourceByKey[mapKey] = composed;
        }
        const next = { ...state, signalLiveSourceByKey };
        persistScope(state.scopeKey, next);
        return { signalLiveSourceByKey };
      });
    },
    setCardPrimary: (componentId, signalKey) => {
      const id = componentId.trim();
      const key = signalKey.trim();
      if (id.length === 0 || key.length === 0) {
        return;
      }
      set((state) => {
        const cardPrimaryByComponent = { ...state.cardPrimaryByComponent, [id]: key };
        const next = { ...state, cardPrimaryByComponent };
        persistScope(state.scopeKey, next);
        return { cardPrimaryByComponent };
      });
    },
    resetSignalMapping: (componentId, signalKey) => {
      const mapKey = twinMappingSignalKey(componentId, signalKey);
      set((state) => {
        const signalLiveSourceByKey = { ...state.signalLiveSourceByKey };
        delete signalLiveSourceByKey[mapKey];
        const next = { ...state, signalLiveSourceByKey };
        persistScope(state.scopeKey, next);
        return { signalLiveSourceByKey };
      });
    },
    resetComponentMappings: (componentId) => {
      const id = componentId.trim();
      if (id.length === 0) {
        return;
      }
      set((state) => {
        const signalLiveSourceByKey = { ...state.signalLiveSourceByKey };
        for (const key of Object.keys(signalLiveSourceByKey)) {
          if (key.startsWith(`${id}::`)) {
            delete signalLiveSourceByKey[key];
          }
        }
        const cardPrimaryByComponent = { ...state.cardPrimaryByComponent };
        delete cardPrimaryByComponent[id];
        const next = { ...state, signalLiveSourceByKey, cardPrimaryByComponent };
        persistScope(state.scopeKey, next);
        return { signalLiveSourceByKey, cardPrimaryByComponent };
      });
    },
    resetAllMappings: () => {
      const { scopeKey } = get();
      set({ signalLiveSourceByKey: {}, cardPrimaryByComponent: {} });
      persistScope(scopeKey, get());
    },
    snapshot: () => {
      const state = get();
      return {
        schema: "bitstream.animation-lab.twin-mapping",
        version: 1,
        signalLiveSourceByKey: state.signalLiveSourceByKey,
        cardPrimaryByComponent: state.cardPrimaryByComponent,
      };
    },
  }),
);

export function readEffectiveLiveSourceKeyForRow(args: {
  metadataLiveSourceKey?: string;
  signalLiveSourceByKey: Record<string, string | null>;
  componentId: string;
  signalKey: string;
}): string | undefined {
  const mapKey = twinMappingSignalKey(args.componentId, args.signalKey);
  const hasOverride = Object.prototype.hasOwnProperty.call(args.signalLiveSourceByKey, mapKey);
  return resolveEffectiveTwinLiveSourceKey({
    metadataLiveSourceKey: args.metadataLiveSourceKey,
    overrideLiveSourceKey: hasOverride ? args.signalLiveSourceByKey[mapKey] : undefined,
  });
}

export function readMappingColumnsForRow(args: {
  metadataLiveSourceKey?: string;
  signalLiveSourceByKey: Record<string, string | null>;
  componentId: string;
  signalKey: string;
}): { sensor: TwinMappingSensorId; subParam: string } {
  const effective = readEffectiveLiveSourceKeyForRow(args);
  return decomposeTwinLiveSourceKey(effective);
}
