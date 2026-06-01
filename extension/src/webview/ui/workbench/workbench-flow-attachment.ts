import type { WorkbenchLayoutSnapshotV1 } from "./workbench-layout-library";
import { WORKBENCH_LAYOUT_LIBRARY_VERSION } from "./workbench-layout-library";

export const WORKBENCH_FLOW_ATTACHMENT_VERSION = 1 as const;

export type WorkbenchFlowAttachmentV1 = {
  version: typeof WORKBENCH_FLOW_ATTACHMENT_VERSION;
  appId: string;
  snapshot: WorkbenchLayoutSnapshotV1;
};

export function createWorkbenchFlowAttachment(
  snapshot: WorkbenchLayoutSnapshotV1,
): WorkbenchFlowAttachmentV1 {
  return {
    version: WORKBENCH_FLOW_ATTACHMENT_VERSION,
    appId: snapshot.appId,
    snapshot: structuredClone(snapshot),
  };
}

export function coerceWorkbenchFlowAttachment(value: unknown): WorkbenchFlowAttachmentV1 | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Partial<WorkbenchFlowAttachmentV1>;
  const snapshot = row.snapshot;
  if (
    row.version !== WORKBENCH_FLOW_ATTACHMENT_VERSION ||
    typeof row.appId !== "string" ||
    !snapshot ||
    typeof snapshot !== "object"
  ) {
    return null;
  }
  const snap = snapshot as WorkbenchLayoutSnapshotV1;
  if (
    snap.version !== WORKBENCH_LAYOUT_LIBRARY_VERSION ||
    typeof snap.appId !== "string" ||
    snap.layout == null ||
    typeof snap.layout !== "object"
  ) {
    return null;
  }
  if (snap.appId !== row.appId) {
    return null;
  }
  return {
    version: WORKBENCH_FLOW_ATTACHMENT_VERSION,
    appId: row.appId,
    snapshot: structuredClone(snap),
  };
}
