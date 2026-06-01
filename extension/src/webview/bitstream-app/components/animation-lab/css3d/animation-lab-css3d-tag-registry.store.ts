import { create } from "zustand";

export type AnimationLabCss3dTagRegistration = {
  id: string;
  element: HTMLElement;
  anchor: HTMLElement;
};

type AnimationLabCss3dTagRegistryState = {
  tags: Record<string, AnimationLabCss3dTagRegistration>;
  registerTag: (entry: AnimationLabCss3dTagRegistration) => void;
  unregisterTag: (id: string) => void;
  clearTags: () => void;
};

export const useAnimationLabCss3dTagRegistryStore = create<AnimationLabCss3dTagRegistryState>(
  (set) => ({
    tags: {},
    registerTag: (entry) =>
      set((state) => ({
        tags: { ...state.tags, [entry.id]: entry },
      })),
    unregisterTag: (id) =>
      set((state) => {
        const next = { ...state.tags };
        delete next[id];
        return { tags: next };
      }),
    clearTags: () => set({ tags: {} }),
  }),
);
