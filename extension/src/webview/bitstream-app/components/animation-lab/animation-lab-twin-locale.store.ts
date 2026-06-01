import { create } from "zustand";
import {
  isAnimationLabTwinLocale,
  persistAnimationLabTwinLocale,
  readAnimationLabTwinLocale,
  type AnimationLabTwinLocale,
} from "./animation-lab-twin-i18n.js";

type AnimationLabTwinLocaleStoreState = {
  locale: AnimationLabTwinLocale;
  setLocale: (locale: AnimationLabTwinLocale) => void;
  hydrate: () => void;
};

export const useAnimationLabTwinLocaleStore = create<AnimationLabTwinLocaleStoreState>((set) => ({
  locale: readAnimationLabTwinLocale(),
  setLocale: (locale) => {
    if (!isAnimationLabTwinLocale(locale)) {
      return;
    }
    persistAnimationLabTwinLocale(locale);
    set({ locale });
  },
  hydrate: () => {
    set({ locale: readAnimationLabTwinLocale() });
  },
}));
