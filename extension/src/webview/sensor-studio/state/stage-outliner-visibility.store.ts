import { create } from "zustand";
import {
  readStoredStageOutlinerHiddenKeys,
  writeStoredStageOutlinerHiddenKeys,
} from "../features/stage/stage-outliner-ui-persistence";

type StageOutlinerVisibilityStore = {
  hiddenKeys: ReadonlySet<string>;
  toggleHidden: (key: string) => void;
  setHidden: (key: string, hidden: boolean) => void;
  isHidden: (key: string) => boolean;
  pruneHiddenKeys: (validKeys: ReadonlySet<string>) => void;
};

function persistHiddenKeys(keys: ReadonlySet<string>): void {
  writeStoredStageOutlinerHiddenKeys([...keys]);
}

export const useStageOutlinerVisibilityStore = create<StageOutlinerVisibilityStore>(
  (set, get) => ({
    hiddenKeys: new Set(readStoredStageOutlinerHiddenKeys()),
    toggleHidden: (key) => {
      const trimmed = key.trim();
      if (trimmed.length === 0) {
        return;
      }
      set((state) => {
        const next = new Set(state.hiddenKeys);
        if (next.has(trimmed)) {
          next.delete(trimmed);
        } else {
          next.add(trimmed);
        }
        persistHiddenKeys(next);
        return { hiddenKeys: next };
      });
    },
    setHidden: (key, hidden) => {
      const trimmed = key.trim();
      if (trimmed.length === 0) {
        return;
      }
      set((state) => {
        const next = new Set(state.hiddenKeys);
        if (hidden) {
          next.add(trimmed);
        } else {
          next.delete(trimmed);
        }
        persistHiddenKeys(next);
        return { hiddenKeys: next };
      });
    },
    isHidden: (key) => get().hiddenKeys.has(key.trim()),
    pruneHiddenKeys: (validKeys) => {
      set((state) => {
        let changed = false;
        const next = new Set<string>();
        for (const key of state.hiddenKeys) {
          if (validKeys.has(key)) {
            next.add(key);
          } else {
            changed = true;
          }
        }
        if (!changed) {
          return state;
        }
        persistHiddenKeys(next);
        return { hiddenKeys: next };
      });
    },
  }),
);
