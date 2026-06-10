import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi";
import { registerCourseStudioMediaUri } from "../content/courseStudioMediaUriStore";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `course-img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

type SaveImageResponse = {
  type: string;
  requestId?: string;
  ok?: boolean;
  error?: string;
  markdownPath?: string;
  webviewSrc?: string;
};

export async function saveCourseImageExtension(
  dataUrl: string,
  suggestedName: string,
): Promise<
  | { ok: true; sourcePath: string; markdownPath: string }
  | { ok: false; error: string }
> {
  const api = getVsCodeApi();
  if (api == null) {
    return { ok: false, error: "VS Code webview API is not available." };
  }

  const requestId = nextRequestId();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "Image save timed out." });
    }, 30_000);

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as SaveImageResponse;
      if (msg?.type !== "course-studio-save-image-response" || msg.requestId !== requestId) {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      if (msg.ok !== true || msg.markdownPath == null) {
        resolve({ ok: false, error: msg.error ?? "Image save failed." });
        return;
      }
      if (msg.webviewSrc != null) {
        registerCourseStudioMediaUri(msg.markdownPath, msg.webviewSrc);
      }
      resolve({
        ok: true,
        sourcePath: msg.markdownPath,
        markdownPath: msg.markdownPath,
      });
    };

    window.addEventListener("message", onMessage);
    api.postMessage({
      type: "course-studio-save-image",
      requestId,
      dataUrl,
      suggestedName,
    });
  });
}
