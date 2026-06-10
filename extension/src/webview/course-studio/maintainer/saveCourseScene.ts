import type { SceneV1 } from "../schemas/scene.v1";
import { isCourseContentReadOnlySourcePath } from "../content/courseSourcePaths";
import { saveCourseSceneDev } from "./saveCourseSceneDev";
import { saveCourseSceneExtension } from "./saveCourseSceneExtension";

export async function saveCourseScene(
  sourcePath: string,
  scene: SceneV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isCourseContentReadOnlySourcePath(sourcePath)) {
    return { ok: false, error: "This scene is loaded from a read-only presentation pack." };
  }

  if (import.meta.env.DEV) {
    return saveCourseSceneDev(sourcePath, scene);
  }

  return saveCourseSceneExtension(sourcePath, scene);
}
