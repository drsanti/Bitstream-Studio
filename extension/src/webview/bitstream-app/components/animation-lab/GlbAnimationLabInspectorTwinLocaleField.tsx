import { TRNFormField, TRNSelect } from "@/ui/TRN";
import {
  isAnimationLabTwinLocale,
  twinI18n,
  twinLocaleSelectOptions,
} from "./animation-lab-twin-i18n.js";
import { useAnimationLabTwinLocaleStore } from "./animation-lab-twin-locale.store.js";

export function GlbAnimationLabInspectorTwinLocaleField() {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  const setLocale = useAnimationLabTwinLocaleStore((s) => s.setLocale);

  return (
    <TRNFormField
      label={twinI18n(locale, "inspector.localeLabel")}
      hint={twinI18n(locale, "inspector.localeHint")}
    >
      <TRNSelect
        size="sm"
        ariaLabel={twinI18n(locale, "inspector.localeLabel")}
        value={locale}
        options={twinLocaleSelectOptions()}
        onValueChange={(value) => {
          if (isAnimationLabTwinLocale(value)) {
            setLocale(value);
          }
        }}
      />
    </TRNFormField>
  );
}
