import { create } from "zustand";

import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import {
  applyPresentationPackRuntime,
  type ApplyPresentationPackRuntimeResult,
} from "./presentationPackLoad";

type CoursePackStoreState = {
  activePackId: string | null;
  activePageId: string | null;
  readOnly: boolean;
  pageIds: string[];
  registerPack: (
    pack: PresentationPackV1,
    options?: {
      readOnly?: boolean;
      primaryPageId?: string;
      sourcePathMode?: "virtual" | "content";
    },
  ) => ApplyPresentationPackRuntimeResult;
  setActivePageId: (pageId: string | null) => void;
};

export const useCoursePackStore = create<CoursePackStoreState>((set) => ({
  activePackId: null,
  activePageId: null,
  readOnly: true,
  pageIds: [],
  registerPack: (pack, options) => {
    const result = applyPresentationPackRuntime(pack, options);
    set({
      activePackId: result.packId,
      activePageId: result.primaryPageId,
      readOnly: result.overlay.readOnly,
      pageIds: result.pageIds,
    });
    return result;
  },
  setActivePageId: (pageId) => set({ activePageId: pageId }),
}));

export function registerCoursePresentationPack(
  pack: PresentationPackV1,
  options?: {
    readOnly?: boolean;
    primaryPageId?: string;
    sourcePathMode?: "virtual" | "content";
  },
): ApplyPresentationPackRuntimeResult {
  return useCoursePackStore.getState().registerPack(pack, options);
}
