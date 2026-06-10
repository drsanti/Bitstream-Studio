import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi";
import type { SceneV1 } from "../schemas/scene.v1";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `course-scene-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type SaveSceneResponse = {
  type: string;
  requestId?: string;
  ok?: boolean;
  error?: string;
  path?: string;
};

export async function saveCourseSceneExtension(
  sourcePath: string,
  scene: SceneV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const api = getVsCodeApi();
  if (api == null) {
    return { ok: false, error: "VS Code webview API is not available." };
  }

  const requestId = nextRequestId();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "Scene save timed out." });
    }, 30_000);

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as SaveSceneResponse;
      if (msg?.type !== "course-studio-save-scene-response" || msg.requestId !== requestId) {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      if (msg.ok !== true) {
        resolve({ ok: false, error: msg.error ?? "Scene save failed." });
        return;
      }
      resolve({ ok: true });
    };

    window.addEventListener("message", onMessage);
    api.postMessage({
      type: "course-studio-save-scene",
      requestId,
      sourcePath,
      scene,
    });
  });
}
