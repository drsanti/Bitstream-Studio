import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinComponentDef,
  AnimationLabTwinComponentLive,
  AnimationLabTwinSignalDef,
} from "./digital-twin.types.js";
import type { AnimationLabTwinLocale } from "./animation-lab-twin-i18n.js";

export function readLocalizedString(
  locale: AnimationLabTwinLocale,
  primary: string,
  locales?: Partial<Record<AnimationLabTwinLocale, string>>,
): string {
  if (locale === "en") {
    return primary;
  }
  const translated = locales?.[locale]?.trim();
  return translated != null && translated.length > 0 ? translated : primary;
}

export function resolveTwinComponentDisplayLabel(
  component: AnimationLabTwinComponentDef,
  locale: AnimationLabTwinLocale,
): string {
  return readLocalizedString(locale, component.label, component.labelLocales);
}

export function resolveTwinSignalDisplayLabel(
  signal: AnimationLabTwinSignalDef,
  locale: AnimationLabTwinLocale,
): string {
  return readLocalizedString(locale, signal.label, signal.labelLocales);
}

export function localizeTwinComponentsLive(
  twin: AnimationLabDigitalTwinDef,
  components: readonly AnimationLabTwinComponentLive[],
  locale: AnimationLabTwinLocale,
): AnimationLabTwinComponentLive[] {
  return components.map((component) => {
    const def = twin.components.find((c) => c.id === component.id);
    const label =
      def != null ? resolveTwinComponentDisplayLabel(def, locale) : component.label;
    const signals = component.signals.map((signal) => {
      const signalDef = def?.signals.find((s) => s.key === signal.key);
      const signalLabel =
        signalDef != null
          ? resolveTwinSignalDisplayLabel(signalDef, locale)
          : signal.label;
      return { ...signal, label: signalLabel };
    });
    return { ...component, label, signals };
  });
}
