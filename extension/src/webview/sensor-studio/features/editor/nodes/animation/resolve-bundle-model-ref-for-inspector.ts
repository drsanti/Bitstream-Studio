import type { Edge } from "@xyflow/react";

const MODEL_VIEWER_URL_HANDLE = "in";

type NodeLite = {
  id: string;
  data: { nodeId: string; label?: string };
};

function normalizeTargetHandle(h: string | null | undefined): string {
  if (h == null || h === "") {
    return MODEL_VIEWER_URL_HANDLE;
  }
  return h;
}

function modelSelectFeedingViewerModelUrl(
  byId: Map<string, NodeLite>,
  edges: readonly Edge[],
  viewerId: string,
): string | null {
  const incomingToViewer = edges.filter((e) => e.target === viewerId);

  const strict = incomingToViewer.filter((e) => {
    const th = normalizeTargetHandle(e.targetHandle);
    if (th !== MODEL_VIEWER_URL_HANDLE) {
      return false;
    }
    const src = byId.get(e.source);
    return src?.data.nodeId === "model-select";
  });
  if (strict.length === 1) {
    return strict[0]?.source ?? null;
  }
  if (strict.length > 1) {
    return null;
  }

  const loose = incomingToViewer.filter((e) => {
    const src = byId.get(e.source);
    return src?.data.nodeId === "model-select";
  });
  if (loose.length === 1) {
    return loose[0]?.source ?? null;
  }
  return null;
}

export type BundleInspectorModelRef =
  | { status: "ok"; modelFlowId: string }
  | { status: "viewer_no_model" }
  | { status: "no_viewer" };

/**
 * When **GLB Animation Bundle** output connects to a **model-viewer**, resolve the **model-select**
 * that feeds that viewer’s **Model (URL)** input (same graph rules as simulation wiring).
 */
export function resolveBundleModelRefForInspector(
  nodes: readonly NodeLite[],
  edges: readonly Edge[],
  bundleFlowId: string,
): BundleInspectorModelRef {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const fromBundle = edges.filter((e) => e.source === bundleFlowId);

  let sawViewer = false;
  for (const e of fromBundle) {
    const target = byId.get(e.target);
    if (target?.data.nodeId !== "model-viewer") {
      continue;
    }
    sawViewer = true;
    const modelFlowId = modelSelectFeedingViewerModelUrl(byId, edges, target.id);
    if (modelFlowId != null) {
      return {
        status: "ok",
        modelFlowId,
      };
    }
  }

  if (sawViewer) {
    return { status: "viewer_no_model" };
  }
  return { status: "no_viewer" };
}
