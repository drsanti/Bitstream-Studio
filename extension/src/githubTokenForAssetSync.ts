import * as vscode from "vscode";

/**
 * GitHub PAT for REST API (tree / contents). User setting overrides `GITHUB_TOKEN` env.
 * Unauthenticated requests share a low per-IP rate limit; a token raises the limit.
 */
export function resolveGithubTokenForAssetSync(): string | undefined {
  const raw = vscode.workspace.getConfiguration("ternion").get<unknown>("githubToken");
  const fromSettings = typeof raw === "string" ? raw.trim() : "";
  if (fromSettings) {
    return fromSettings;
  }
  return process.env.GITHUB_TOKEN?.trim() || undefined;
}
