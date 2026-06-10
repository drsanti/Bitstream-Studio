import type { SceneV1 } from "../schemas/scene.v1";
import { isCourseContentReadOnlySourcePath } from "../content/courseSourcePaths";

export async function saveCourseSceneDev(
  sourcePath: string,
  scene: SceneV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Save is only available in Vite dev mode." };
  }

  if (isCourseContentReadOnlySourcePath(sourcePath)) {
    return { ok: false, error: "This scene is loaded from a read-only presentation pack." };
  }

  const response = await fetch("/__dev_api/course-studio/save-scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath, scene }),
  });

  const body = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || body.ok !== true) {
    return { ok: false, error: body.error ?? `Save failed (${response.status})` };
  }
  return { ok: true };
}
