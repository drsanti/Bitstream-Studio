import { useEffect } from "react";
import { readCourseStudioBootstrapModeFromLocation } from "../content/bootstrapCourseStudioBlank";
import { buildCourseOutlineSessionDraft } from "../content/courseOutlineSessionDraft";
import { persistCourseStudioSessionDraft } from "../content/courseStudioSessionDraft";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

const PERSIST_DEBOUNCE_MS = 400;

export function useCourseStudioSessionPersistence(): void {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const bootstrapMode = readCourseStudioBootstrapModeFromLocation();

    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedulePersist = () => {
      if (timer != null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        persistCourseStudioSessionDraft(bootstrapMode, buildCourseOutlineSessionDraft());
      }, PERSIST_DEBOUNCE_MS);
    };

    const unsubPage = useCoursePageEditorStore.subscribe(schedulePersist);
    const unsubOutline = useCourseOutlineStore.subscribe(schedulePersist);
    const unsubDiagram = useCourseDiagramEditorStore.subscribe(schedulePersist);
    const unsubScene = useCourseSceneEditorStore.subscribe(schedulePersist);

    return () => {
      unsubPage();
      unsubOutline();
      unsubDiagram();
      unsubScene();
      if (timer != null) {
        clearTimeout(timer);
      }
    };
  }, []);
}
