import {
  resolveEffectiveTwinLiveSourceKey,
  twinMappingSignalKey,
} from "./animation-lab-twin-mapping-catalog.js";
import type { AnimationLabTwinMappingSnapshot } from "./animation-lab-twin-mapping.persistence.js";
import type { AnimationLabDigitalTwinDef } from "./digital-twin.types.js";

export function applyAnimationLabTwinMappingOverrides(
  twin: AnimationLabDigitalTwinDef,
  snapshot: Pick<AnimationLabTwinMappingSnapshot, "signalLiveSourceByKey" | "cardPrimaryByComponent">,
): AnimationLabDigitalTwinDef {
  return {
    ...twin,
    components: twin.components.map((component) => {
      const primaryOverride = snapshot.cardPrimaryByComponent[component.id];
      return {
        ...component,
        cardPrimarySignalKey:
          primaryOverride != null && primaryOverride.length > 0
            ? primaryOverride
            : component.cardPrimarySignalKey,
        signals: component.signals.map((signal) => {
          const mapKey = twinMappingSignalKey(component.id, signal.key);
          const hasOverride = Object.prototype.hasOwnProperty.call(
            snapshot.signalLiveSourceByKey,
            mapKey,
          );
          const liveSourceKey = resolveEffectiveTwinLiveSourceKey({
            metadataLiveSourceKey: signal.liveSourceKey,
            overrideLiveSourceKey: hasOverride ? snapshot.signalLiveSourceByKey[mapKey] : undefined,
          });
          if (liveSourceKey === signal.liveSourceKey) {
            return signal;
          }
          if (liveSourceKey == null) {
            const { liveSourceKey: _removed, ...rest } = signal;
            return rest;
          }
          return { ...signal, liveSourceKey };
        }),
      };
    }),
  };
}

export function resolveTwinCardPrimarySignalKey(
  componentId: string,
  signalKeys: readonly string[],
  args: {
    metadataPrimaryKey?: string;
    cardPrimaryByComponent: Record<string, string>;
  },
): string {
  const override = args.cardPrimaryByComponent[componentId]?.trim();
  if (override != null && override.length > 0 && signalKeys.includes(override)) {
    return override;
  }
  const meta = args.metadataPrimaryKey?.trim();
  if (meta != null && meta.length > 0 && signalKeys.includes(meta)) {
    return meta;
  }
  return signalKeys[0] ?? "";
}
