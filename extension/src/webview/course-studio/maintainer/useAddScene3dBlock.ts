import { useCallback } from "react";
import { toast } from "react-toastify";
import { readCourseStudioBootstrapModeFromLocation } from "../content/bootstrapCourseStudioBlank";
import { persistCourseStudioSessionDraft } from "../content/courseStudioSessionDraft";
import {
  persistNewCourseSceneToDev,
  prepareNewCourseScene,
  type CourseSceneTemplate,
} from "../content/sceneTemplates";
import { createPageBlock } from "./blockFactory";
import { suppressCoursePageGridDeselect } from "./coursePageEditorDeselectGuard";
import { useFocusAddedScene3dBlock } from "./useFocusAddedScene3dBlock";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function useAddScene3dBlock(defaultTemplate: CourseSceneTemplate = "blank") {
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const focusAddedScene3dBlock = useFocusAddedScene3dBlock();

  return useCallback(
    (template: CourseSceneTemplate = defaultTemplate) => {
      const page = useCoursePageEditorStore.getState().page;
      if (page == null) {
        return;
      }

      try {
        const built = prepareNewCourseScene(template);
        const block = createPageBlock("scene-3d", page, { documentId: built.documentId });
        suppressCoursePageGridDeselect();
        addBlock(block);
        focusAddedScene3dBlock(block.id);

        if (readCourseStudioBootstrapModeFromLocation() === "blank") {
          persistCourseStudioSessionDraft("blank");
        }

        void persistNewCourseSceneToDev(built).then((persist) => {
          if (!persist.ok) {
            toast.warn(
              `3D Scene added in memory; dev save failed: ${persist.error}. Save the page after fixing the dev API.`,
            );
          }
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create 3D Scene block.");
      }
    },
    [addBlock, defaultTemplate, focusAddedScene3dBlock],
  );
}

export function useOpenScene3dBlockInEditor() {
  const focusAddedScene3dBlock = useFocusAddedScene3dBlock();

  return useCallback(
    (blockId: string) => {
      focusAddedScene3dBlock(blockId);
    },
    [focusAddedScene3dBlock],
  );
}
