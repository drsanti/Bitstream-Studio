import type { PageV1 } from "../schemas/page.v1";
import { parseSceneV1 } from "../schemas/scene.v1";
import { useCourseSceneEditorStore } from "../maintainer/useCourseSceneEditorStore";
import { courseSceneSourcePathForId } from "./sceneTemplates";
import { registerCourseScene } from "./sceneRegistry";

const SCENE_JSON_BY_ID = import.meta.glob<{ default: unknown }>("./*.scene.v1.json", {
  eager: true,
});

function collectSceneDocumentIdsFromPage(page: PageV1): string[] {
  const ids = new Set<string>();
  for (const block of page.blocks) {
    if (block.kind === "scene-3d") {
      ids.add(block.documentId);
    }
  }
  return [...ids];
}

function loadBundledSceneJson(documentId: string) {
  const moduleKey = `./${documentId}.scene.v1.json`;
  const mod = SCENE_JSON_BY_ID[moduleKey];
  if (mod == null) {
    return null;
  }
  return parseSceneV1(mod.default);
}

/** Register scene JSON files referenced by page blocks (saved under content/). */
export function initCourseScenesForPage(page: PageV1): void {
  const { drafts } = useCourseSceneEditorStore.getState();

  for (const documentId of collectSceneDocumentIdsFromPage(page)) {
    if (drafts[documentId] != null) {
      continue;
    }
    const scene = loadBundledSceneJson(documentId);
    if (scene == null) {
      continue;
    }
    registerCourseScene(scene, courseSceneSourcePathForId(documentId));
  }
}
