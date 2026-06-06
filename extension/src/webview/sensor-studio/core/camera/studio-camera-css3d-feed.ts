import type { FlowWireVideoBusV1 } from "./flow-wire-video";
import { isFlowWireVideoBusV1 } from "./flow-wire-video";

export type Css3dCameraAnchorMode = "screen" | "world";

export type Css3dCameraFeedSpec = {
  feedNodeId: string;
  cameraNodeId: string;
  visible: boolean;
  opacity: number;
  anchorMode: Css3dCameraAnchorMode;
  anchor: { x: number; y: number; z: number };
  sizePx: { w: number; h: number };
  borderRadiusPx: number;
};

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readAnchor(raw: unknown): { x: number; y: number; z: number } {
  if (raw == null || typeof raw !== "object") {
    return { x: 0, y: 0, z: 0 };
  }
  const o = raw as Record<string, unknown>;
  return {
    x: readFinite(o.x, 0),
    y: readFinite(o.y, 0),
    z: readFinite(o.z, 0),
  };
}

function readSizePx(raw: unknown): { w: number; h: number } {
  if (raw == null || typeof raw !== "object") {
    return { w: 320, h: 180 };
  }
  const o = raw as Record<string, unknown>;
  return {
    w: Math.max(64, Math.min(1920, Math.round(readFinite(o.w, 320)))),
    h: Math.max(48, Math.min(1080, Math.round(readFinite(o.h, 180)))),
  };
}

type FeedNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveVideoBusWire?: FlowWireVideoBusV1;
    liveInputBooleanByHandle?: Record<string, boolean>;
    liveInputNumberByHandle?: Record<string, number>;
  };
};

export function buildCss3dCameraFeedSpec(node: FeedNodeLike): Css3dCameraFeedSpec | null {
  if (node.data.nodeId !== "css3d-camera-feed") {
    return null;
  }
  const wire = node.data.liveVideoBusWire;
  if (!isFlowWireVideoBusV1(wire)) {
    return null;
  }
  const cfg = node.data.defaultConfig;
  const visibleIncoming = node.data.liveInputBooleanByHandle?.visible;
  const visible =
    typeof visibleIncoming === "boolean"
      ? visibleIncoming
      : cfg.visible !== false;
  const opacityIncoming = node.data.liveInputNumberByHandle?.opacity;
  const opacityRaw =
    typeof opacityIncoming === "number" && Number.isFinite(opacityIncoming)
      ? opacityIncoming
      : readFinite(cfg.opacity, 1);
  const opacity = Math.max(0, Math.min(1, opacityRaw));
  const anchorMode: Css3dCameraAnchorMode =
    cfg.anchorMode === "world" ? "world" : "screen";

  return {
    feedNodeId: node.id,
    cameraNodeId: wire.sourceNodeId,
    visible,
    opacity,
    anchorMode,
    anchor: readAnchor(cfg.anchor),
    sizePx: readSizePx(cfg.sizePx),
    borderRadiusPx: Math.max(
      0,
      Math.min(64, Math.round(readFinite(cfg.borderRadiusPx, 8))),
    ),
  };
}

/** Active CSS3D / screen camera feed nodes on the canvas. */
export function collectCss3dCameraFeeds(
  nodes: readonly FeedNodeLike[],
): Css3dCameraFeedSpec[] {
  const feeds: Css3dCameraFeedSpec[] = [];
  for (const node of nodes) {
    const spec = buildCss3dCameraFeedSpec(node);
    if (spec == null || !spec.visible || spec.opacity <= 0) {
      continue;
    }
    feeds.push(spec);
  }
  return feeds;
}
