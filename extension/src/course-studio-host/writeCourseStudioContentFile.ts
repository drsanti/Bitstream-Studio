import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

const CONTENT_PREFIX = "src/webview/course-studio/content/";

export function isCourseStudioContentSourcePath(sourcePath: string): boolean {
  const normalized = sourcePath.replace(/\\/g, "/");
  return (
    normalized.startsWith(CONTENT_PREFIX) &&
    (normalized.endsWith(".scene.v1.json") ||
      normalized.endsWith(".diagram.v1.json") ||
      normalized.endsWith(".page.v1.json") ||
      normalized.endsWith(".md"))
  );
}

export function resolveCourseStudioContentFileUri(
  sourcePath: string,
): vscode.Uri | null {
  const normalized = sourcePath.replace(/\\/g, "/");
  if (!isCourseStudioContentSourcePath(normalized)) {
    return null;
  }
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder == null) {
    return null;
  }
  const destPath = path.join(folder.uri.fsPath, normalized);
  const contentRoot = path.join(folder.uri.fsPath, CONTENT_PREFIX);
  if (!destPath.startsWith(contentRoot)) {
    return null;
  }
  return vscode.Uri.file(destPath);
}

export function writeCourseStudioContentFile(
  sourcePath: string,
  jsonText: string,
): { ok: true; path: string } | { ok: false; error: string } {
  const fileUri = resolveCourseStudioContentFileUri(sourcePath);
  if (fileUri == null) {
    return {
      ok: false,
      error:
        "Open the Bitstream-Studio extension folder as a workspace folder to save course content files.",
    };
  }
  try {
    fs.mkdirSync(path.dirname(fileUri.fsPath), { recursive: true });
    fs.writeFileSync(fileUri.fsPath, jsonText, "utf8");
    return { ok: true, path: sourcePath };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to write file.",
    };
  }
}
