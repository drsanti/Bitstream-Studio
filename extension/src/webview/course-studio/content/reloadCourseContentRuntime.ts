import type { PageV1 } from "../schemas/page.v1";
import type { PresentationPackV1 } from "../schemas/presentationPack.v1";
import { initCourseDiagramRegistryRespectingOverlay } from "./diagramRegistry";
import { initCourseMarkdownRegistryRespectingOverlay } from "./markdownRegistry";
import { initCourseSceneRegistryRespectingOverlay } from "./sceneRegistry";
import {
  cloneCoursePage,
  getCoursePageSourcePath,
  loadCoursePage,
} from "./pageRegistry";
import { getActiveCoursePackOverlay } from "./presentationPackLoad";
import { registerCoursePresentationPack } from "./useCoursePackStore";
import { useCourseDiagramEditorStore } from "../maintainer/useCourseDiagramEditorStore";
import { useCourseMarkdownEditorStore } from "../maintainer/useCourseMarkdownEditorStore";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { useCourseSceneEditorStore } from "../maintainer/useCourseSceneEditorStore";

function resetMaintainerContentStores(): void {
  useCourseDiagramEditorStore.setState({
    sourcePaths: {},
    baselines: {},
    drafts: {},
    dirty: {},
    selectedNodeIds: {},
    selected3dNodeIds: {},
    historyStacks: {},
  });
  useCourseMarkdownEditorStore.setState({
    sourcePaths: {},
    baselines: {},
    drafts: {},
    dirty: {},
  });
  useCourseSceneEditorStore.setState({
    sourcePaths: {},
    baselines: {},
    drafts: {},
    dirty: {},
    selectedNodeIdLists: {},
    activeNodeIds: {},
    historyStacks: {},
  });
}

export function reloadCourseContentRuntime(
  pack: PresentationPackV1,
  activePageId: string,
): { page: PageV1; sourcePath: string; pageIds: string[] } {
  registerCoursePresentationPack(pack, {
    readOnly: false,
    sourcePathMode: "content",
    primaryPageId: activePageId,
  });

  resetMaintainerContentStores();
  initCourseDiagramRegistryRespectingOverlay();
  initCourseMarkdownRegistryRespectingOverlay();
  initCourseSceneRegistryRespectingOverlay();

  const page = loadCoursePage(activePageId);
  const sourcePath = getCoursePageSourcePath(activePageId);
  if (page == null || sourcePath == null) {
    throw new Error(`Reload failed: page "${activePageId}" not found in content.`);
  }

  const cloned = cloneCoursePage(page);
  useCoursePageEditorStore.getState().initPage(cloned, sourcePath);

  return {
    page: cloned,
    sourcePath,
    pageIds: getActiveCoursePackOverlay()?.pageIds ?? [activePageId],
  };
}
