import { T3DVSCodeUtils } from "@ternion/t3d/vscode-webview";
import type { ExtensionMessage } from "../../../types";
import { PROJECT4_ROBOT_FREE_PACK_REPO_PATHS } from "./project4-robot-asset-constants";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p4-free-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type Project4RobotFreePackSyncResult = NonNullable<
  ExtensionMessage["assetSyncResult"]
>;

/**
 * VS Code extension webview: download only the Project 4 robot GLB from the Free GitHub pack into the
 * configured Free mirror folder (`globalStorage`), via host `asset-sync-free-pack-start`.
 */
export function syncProject4RobotFreePackFromGithub(): Promise<Project4RobotFreePackSyncResult> {
  const vscodeApi = window.__VSCODE_API__ ?? T3DVSCodeUtils.getVsCodeApi();
  if (!vscodeApi) {
    return Promise.reject(new Error("VS Code API is not available in this context."));
  }

  const requestId = nextRequestId();

  return new Promise((resolve, reject) => {
    const SYNC_WAIT_MS = 900_000;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMsg);
    };

    const onMsg = (event: MessageEvent) => {
      const d = event.data as ExtensionMessage;
      if (d?.requestId !== requestId) {
        return;
      }
      if (d.type !== "asset-sync-free-pack-complete") {
        return;
      }
      cleanup();
      if (d.error?.trim()) {
        reject(new Error(d.error));
        return;
      }
      if (d.assetSyncResult) {
        resolve(d.assetSyncResult);
        return;
      }
      reject(new Error("Free-pack sync finished without a result."));
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for Free Assets sync (robot GLB)."));
    }, SYNC_WAIT_MS);

    window.addEventListener("message", onMsg);

    vscodeApi.postMessage({
      type: "asset-sync-free-pack-start",
      requestId,
      onlyRepoPaths: [...PROJECT4_ROBOT_FREE_PACK_REPO_PATHS],
    });
  });
}
