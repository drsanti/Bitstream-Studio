import type { WorkbenchLayoutAppId } from "./workbench-layout-library";

const hostSyncPushByApp = new Map<WorkbenchLayoutAppId, () => void>();

export function registerWorkbenchHostMirrorPush(
  appId: WorkbenchLayoutAppId,
  push: () => void,
): () => void {
  hostSyncPushByApp.set(appId, push);
  return () => {
    hostSyncPushByApp.delete(appId);
  };
}

export function notifyWorkbenchHostMirrorDirty(appId: WorkbenchLayoutAppId): void {
  hostSyncPushByApp.get(appId)?.();
}
