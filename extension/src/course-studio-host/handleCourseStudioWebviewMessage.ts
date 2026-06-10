import * as vscode from "vscode";
import { parseSceneV1 } from "../webview/course-studio/schemas/scene.v1";
import {
  isCourseStudioContentSourcePath,
  writeCourseStudioContentFile,
} from "./writeCourseStudioContentFile";

function parseImageDataUrl(
  dataUrl: string,
): { ext: string; buffer: Buffer } | null {
  const match = /^data:image\/([\w+.-]+);base64,(.+)$/s.exec(dataUrl);
  if (match == null) {
    return null;
  }
  const ext = match[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  return { ext, buffer: Buffer.from(match[2], "base64") };
}

async function handleSaveImage(
  message: {
    requestId?: string;
    dataUrl?: string;
    suggestedName?: string;
  },
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
): Promise<void> {
  const { getCourseStudioMediaRootUri } = await import("../extensionAssetPaths");
  const fs = await import("node:fs");

  const requestId = message.requestId;
  const dataUrl = String(message.dataUrl ?? "").trim();
  const suggestedName = String(message.suggestedName ?? "pasted-image.png").trim();

  const respond = (payload: Record<string, unknown>) => {
    void panel.webview.postMessage({
      type: "course-studio-save-image-response",
      requestId,
      ...payload,
    });
  };

  if (dataUrl.length === 0 || !dataUrl.startsWith("data:image/")) {
    respond({ ok: false, error: "dataUrl must be a base64 image data URL" });
    return;
  }

  const parsed = parseImageDataUrl(dataUrl);
  if (parsed == null) {
    respond({ ok: false, error: "Invalid image data URL" });
    return;
  }

  try {
    const mediaRoot = getCourseStudioMediaRootUri(context);
    fs.mkdirSync(mediaRoot.fsPath, { recursive: true });
    const safeBase = suggestedName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-");
    const fileName = `${safeBase || "pasted-image"}-${Date.now()}.${parsed.ext}`;
    const fileUri = vscode.Uri.joinPath(mediaRoot, fileName);
    fs.writeFileSync(fileUri.fsPath, parsed.buffer);
    const markdownPath = `media/${fileName}`;
    const webviewSrc = panel.webview.asWebviewUri(fileUri).toString();
    respond({ ok: true, markdownPath, webviewSrc });
  } catch (err) {
    respond({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save image.",
    });
  }
}

async function handleSaveScene(message: {
  requestId?: string;
  sourcePath?: string;
  scene?: unknown;
}): Promise<Record<string, unknown>> {
  const sourcePath = String(message.sourcePath ?? "").trim();
  if (sourcePath.length === 0 || message.scene == null) {
    return { ok: false, error: "sourcePath and scene are required" };
  }
  if (!isCourseStudioContentSourcePath(sourcePath) || !sourcePath.endsWith(".scene.v1.json")) {
    return { ok: false, error: "sourcePath must be a course-studio scene JSON file" };
  }
  try {
    const validated = parseSceneV1(message.scene);
    const result = writeCourseStudioContentFile(
      sourcePath,
      `${JSON.stringify(validated, null, 2)}\n`,
    );
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true, path: result.path };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid scene JSON.",
    };
  }
}

export async function handleCourseStudioWebviewMessage(
  message: {
    type?: string;
    requestId?: string;
    dataUrl?: string;
    suggestedName?: string;
    sourcePath?: string;
    scene?: unknown;
  },
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
): Promise<boolean> {
  if (message.type === "course-studio-save-image") {
    await handleSaveImage(message, panel, context);
    return true;
  }

  if (message.type === "course-studio-save-scene") {
    const requestId = message.requestId;
    const payload = await handleSaveScene(message);
    void panel.webview.postMessage({
      type: "course-studio-save-scene-response",
      requestId,
      ...payload,
    });
    return true;
  }

  return false;
}
