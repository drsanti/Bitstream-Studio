import type { StudioNode, StudioNodeData } from "../../store/flow-editor.store";
import { FLOW_NODE_BODY_HORIZONTAL_PADDING_PX } from "./flow-node-intrinsic-width-utils";
import { readStudioFlowNodeLayoutSize } from "./studio-node-layout-size";
import { resolveStudioNodeMinDimensionFloor } from "./studio-node-resize-defaults";

export type StudioViewportPreviewAspect = "4:3" | "16:9" | "1:1";
export type StudioViewportPreviewSizeTier = "sm" | "md" | "lg";

export const STUDIO_VIEWPORT_PREVIEW_ASPECTS: readonly StudioViewportPreviewAspect[] =
  ["4:3", "16:9", "1:1"];

export const STUDIO_VIEWPORT_PREVIEW_SIZE_TIERS: readonly StudioViewportPreviewSizeTier[] =
  ["sm", "md", "lg"];

export const STUDIO_VIEWPORT_PREVIEW_DEFAULT_ASPECT: StudioViewportPreviewAspect =
  "4:3";
export const STUDIO_VIEWPORT_PREVIEW_DEFAULT_SIZE_TIER: StudioViewportPreviewSizeTier =
  "md";

/** FlowNodeBody vertical pad + ReadingPanel title, gap, padding, borders (not viewport host). */
export const STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX = 44;

/** Body + ReadingPanel horizontal padding and borders subtracted from node width. */
export const STUDIO_VIEWPORT_PREVIEW_HORIZONTAL_INSET_PX =
  FLOW_NODE_BODY_HORIZONTAL_PADDING_PX + 16 + 2;

const ASPECT_RATIO: Readonly<
  Record<StudioViewportPreviewAspect, { width: number; height: number }>
> = {
  "4:3": { width: 4, height: 3 },
  "16:9": { width: 16, height: 9 },
  "1:1": { width: 1, height: 1 },
};

const TIER_BASE_WIDTH_PX: Readonly<Record<StudioViewportPreviewSizeTier, number>> =
  {
    sm: 320,
    md: 480,
    lg: 640,
  };

const SIZE_TIER_LABEL: Readonly<Record<StudioViewportPreviewSizeTier, string>> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};

/** Conservative head chrome before live measure (header + socket stack + panel chrome). */
const FALLBACK_HEAD_HEIGHT_BY_NODE_ID: Readonly<Record<string, number>> = {
  "model-viewer": 248,
  "rotation-3d-euler": 248,
  "rotation-3d-quaternion": 248,
};

export function studioViewportPreviewSizeTierLabel(
  tier: StudioViewportPreviewSizeTier,
): string {
  return SIZE_TIER_LABEL[tier];
}

export function coerceStudioViewportPreviewAspect(
  raw: unknown,
): StudioViewportPreviewAspect | undefined {
  if (raw === "4:3" || raw === "16:9" || raw === "1:1") {
    return raw;
  }
  return undefined;
}

export function coerceStudioViewportPreviewSizeTier(
  raw: unknown,
): StudioViewportPreviewSizeTier | undefined {
  if (raw === "sm" || raw === "md" || raw === "lg") {
    return raw;
  }
  return undefined;
}

export type StudioViewportPreviewChrome = {
  /** Header + socket region + ReadingPanel chrome above the viewport host. */
  headHeight: number;
  /** Minimum node width from socket/header measure (content min width). */
  minNodeWidth: number;
};

export function resolveViewportPreviewChromeFromNode(
  node: StudioNode,
): StudioViewportPreviewChrome {
  const ui = node.data.ui;
  const nodeId = node.data.nodeId;
  const floor = resolveStudioNodeMinDimensionFloor(nodeId);
  const measuredHead =
    typeof ui?.viewportPreviewHeadHeight === "number" &&
    Number.isFinite(ui.viewportPreviewHeadHeight) &&
    ui.viewportPreviewHeadHeight > 0
      ? Math.round(ui.viewportPreviewHeadHeight)
      : undefined;
  const headHeight = Math.max(
    measuredHead ??
      FALLBACK_HEAD_HEIGHT_BY_NODE_ID[nodeId] ??
      floor.minHeight + STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX,
    STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX + 48,
  );
  const minNodeWidth = Math.max(
    floor.minWidth,
    typeof ui?.contentMinWidth === "number" && Number.isFinite(ui.contentMinWidth)
      ? Math.round(ui.contentMinWidth)
      : floor.minWidth,
  );
  return { headHeight, minNodeWidth };
}

/** Target 3D viewport host size (width-primary tiers). */
export function computeViewportPreviewCanvasDimensions(
  aspect: StudioViewportPreviewAspect,
  tier: StudioViewportPreviewSizeTier,
  _nodeId: string,
): { width: number; height: number } {
  const ratio = ASPECT_RATIO[aspect];
  const baseWidth = TIER_BASE_WIDTH_PX[tier];
  return {
    width: baseWidth,
    height: Math.round((baseWidth * ratio.height) / ratio.width),
  };
}

export type StudioViewportPreviewNodeDimensions = {
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
};

/** RF node box = chrome + target canvas (model B). */
export function computeViewportPreviewNodeDimensions(
  aspect: StudioViewportPreviewAspect,
  tier: StudioViewportPreviewSizeTier,
  nodeId: string,
  chrome: StudioViewportPreviewChrome,
): StudioViewportPreviewNodeDimensions {
  const canvas = computeViewportPreviewCanvasDimensions(aspect, tier, nodeId);
  const floor = resolveStudioNodeMinDimensionFloor(nodeId);
  const width = Math.max(
    chrome.minNodeWidth,
    floor.minWidth,
    canvas.width + STUDIO_VIEWPORT_PREVIEW_HORIZONTAL_INSET_PX,
  );
  const height = Math.max(floor.minHeight, chrome.headHeight + canvas.height);
  return {
    width,
    height,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
  };
}

export function inferViewportPreviewCanvasDimensionsFromNode(node: StudioNode): {
  width: number;
  height: number;
} {
  const { width, height } = readStudioFlowNodeLayoutSize(node);
  const chrome = resolveViewportPreviewChromeFromNode(node);
  return {
    width: Math.max(
      1,
      Math.round(width - STUDIO_VIEWPORT_PREVIEW_HORIZONTAL_INSET_PX),
    ),
    height: Math.max(1, Math.round(height - chrome.headHeight)),
  };
}

export function viewportPreviewCanvasDimensionsMatch(
  canvasWidth: number,
  canvasHeight: number,
  aspect: StudioViewportPreviewAspect,
  tier: StudioViewportPreviewSizeTier,
  nodeId: string,
): boolean {
  const expected = computeViewportPreviewCanvasDimensions(aspect, tier, nodeId);
  return (
    expected.width === Math.round(canvasWidth) &&
    expected.height === Math.round(canvasHeight)
  );
}

export function viewportPreviewNodeDimensionsMatch(
  node: StudioNode,
  aspect: StudioViewportPreviewAspect,
  tier: StudioViewportPreviewSizeTier,
): boolean {
  const canvas = inferViewportPreviewCanvasDimensionsFromNode(node);
  return viewportPreviewCanvasDimensionsMatch(
    canvas.width,
    canvas.height,
    aspect,
    tier,
    node.data.nodeId,
  );
}

export type StudioViewportPreviewLayoutSelection = {
  aspect: StudioViewportPreviewAspect | null;
  sizeTier: StudioViewportPreviewSizeTier | null;
  isCustom: boolean;
  canvasWidth: number;
  canvasHeight: number;
};

export function resolveViewportPreviewLayoutSelection(
  node: StudioNode,
): StudioViewportPreviewLayoutSelection {
  const nodeId = node.data.nodeId;
  const canvas = inferViewportPreviewCanvasDimensionsFromNode(node);
  const storedAspect = coerceStudioViewportPreviewAspect(node.data.ui?.previewAspect);
  const storedTier = coerceStudioViewportPreviewSizeTier(node.data.ui?.previewSizeTier);

  if (
    storedAspect != null &&
    storedTier != null &&
    viewportPreviewCanvasDimensionsMatch(
      canvas.width,
      canvas.height,
      storedAspect,
      storedTier,
      nodeId,
    )
  ) {
    return {
      aspect: storedAspect,
      sizeTier: storedTier,
      isCustom: false,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  }

  for (const aspect of STUDIO_VIEWPORT_PREVIEW_ASPECTS) {
    for (const tier of STUDIO_VIEWPORT_PREVIEW_SIZE_TIERS) {
      if (
        viewportPreviewCanvasDimensionsMatch(
          canvas.width,
          canvas.height,
          aspect,
          tier,
          nodeId,
        )
      ) {
        return {
          aspect,
          sizeTier: tier,
          isCustom: false,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
        };
      }
    }
  }

  return {
    aspect: null,
    sizeTier: null,
    isCustom: true,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
  };
}

export function formatViewportPreviewLayoutSummary(args: {
  nodeWidth: number;
  nodeHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  aspect: StudioViewportPreviewAspect | null;
  sizeTier: StudioViewportPreviewSizeTier | null;
  isCustom: boolean;
}): string {
  const {
    nodeWidth,
    nodeHeight,
    canvasWidth,
    canvasHeight,
    aspect,
    sizeTier,
    isCustom,
  } = args;
  const canvasPart = `Canvas ${canvasWidth} × ${canvasHeight}`;
  if (isCustom || aspect == null || sizeTier == null) {
    return `${canvasPart} · Node ${nodeWidth} × ${nodeHeight} · Custom`;
  }
  return `${canvasPart} · Node ${nodeWidth} × ${nodeHeight} (${aspect} · ${studioViewportPreviewSizeTierLabel(sizeTier)})`;
}

export function stripViewportPreviewLayoutUi<
  T extends {
    previewAspect?: unknown;
    previewSizeTier?: unknown;
  },
>(ui: T | undefined): Omit<T, "previewAspect" | "previewSizeTier"> | undefined {
  if (ui == null) {
    return undefined;
  }
  const { previewAspect: _a, previewSizeTier: _t, ...rest } = ui;
  return Object.keys(rest).length > 0
    ? (rest as Omit<T, "previewAspect" | "previewSizeTier">)
    : undefined;
}

/** Sync head chrome from live canvas measure (`StudioNodeCard`). */
export function patchViewportPreviewHeadHeight(
  ui: StudioNodeData["ui"] | undefined,
  headHeightPx: number,
): StudioNodeData["ui"] | undefined {
  const headHeight = Math.max(
    STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX + 1,
    Math.round(headHeightPx),
  );
  if (ui?.viewportPreviewHeadHeight === headHeight) {
    return ui;
  }
  return { ...ui, viewportPreviewHeadHeight: headHeight };
}
