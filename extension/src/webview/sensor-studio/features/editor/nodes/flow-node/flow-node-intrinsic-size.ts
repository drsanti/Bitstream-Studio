/**
 * Intrinsic min-size helpers for resizable Studio flow nodes.
 * Avoid feedback loops where `w-full` children report scrollWidth === parent width.
 */

import {
  FLOW_NODE_BODY_HORIZONTAL_PADDING_PX,
  FLOW_NODE_BODY_PANEL_PADDING_PX,
  FLOW_NODE_TRN_SELECT_TRIGGER_CHROME_PX,
} from "./flow-node-intrinsic-width-utils";

const STRETCH_FILL_RATIO = 0.92;

/** Max auto-grown width (px) above catalog floor — utility nodes with compact bodies. */
const MAX_AUTO_WIDTH_ABOVE_FLOOR: Readonly<Partial<Record<string, number>>> = {};

export function resolveMaxAutoWidthPx(
  nodeId: string,
  catalogMinWidth: number,
): number | undefined {
  const extra = MAX_AUTO_WIDTH_ABOVE_FLOOR[nodeId];
  if (extra == null) {
    return undefined;
  }
  return catalogMinWidth + extra;
}

function resolveBodyPaddingPx(bodyEl: HTMLElement): number {
  const panel = bodyEl.querySelector<HTMLElement>("[data-flow-node-body-panel]");
  if (panel != null) {
    return FLOW_NODE_BODY_PANEL_PADDING_PX;
  }
  return FLOW_NODE_BODY_HORIZONTAL_PADDING_PX;
}

function resolveMarkerChromePx(bodyEl: HTMLElement): number {
  const raw = bodyEl
    .querySelector<HTMLElement>("[data-flow-node-intrinsic-chrome-px]")
    ?.getAttribute("data-flow-node-intrinsic-chrome-px");
  if (raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) {
      return Math.round(n);
    }
  }
  return FLOW_NODE_TRN_SELECT_TRIGGER_CHROME_PX;
}

/** Width of stretch-filled controls inside `bodyEl` (excluded from min-width math). */
export function measureFlowNodeBodyIntrinsicWidth(bodyEl: HTMLElement): number {
  const bodyClientW = bodyEl.clientWidth;
  let max = 0;
  const markers = bodyEl.querySelectorAll<HTMLElement>(
    "[data-flow-node-intrinsic-width]",
  );
  if (markers.length > 0) {
    markers.forEach((el) => {
      max = Math.max(max, el.scrollWidth);
    });
    const extraRaw = bodyEl
      .querySelector<HTMLElement>("[data-flow-node-intrinsic-extra-px]")
      ?.getAttribute("data-flow-node-intrinsic-extra-px");
    const extraPx =
      extraRaw != null && Number.isFinite(Number(extraRaw))
        ? Math.max(0, Math.round(Number(extraRaw)))
        : 0;
    return (
      max +
      resolveBodyPaddingPx(bodyEl) +
      resolveMarkerChromePx(bodyEl) +
      extraPx
    );
  }
  bodyEl
    .querySelectorAll<HTMLElement>(
      "button, input, textarea, [data-flow-socket-label]",
    )
    .forEach((el) => {
      if (
        bodyClientW > 0 &&
        el.offsetWidth >= Math.floor(bodyClientW * STRETCH_FILL_RATIO)
      ) {
        return;
      }
      max = Math.max(max, el.scrollWidth);
    });
  return max;
}

/** Measure natural width off-canvas — avoids `w-full` / `1fr` parent feedback loops. */
function measureElementUnstretchedScrollWidth(el: HTMLElement): number {
  const clone = el.cloneNode(true) as HTMLElement;
  const relaxStretch = (node: HTMLElement): void => {
    node.classList.remove(
      "w-full",
      "self-stretch",
      "flex-1",
      "min-w-0",
      "max-w-full",
      "truncate",
    );
    node.style.width = "max-content";
    node.style.maxWidth = "none";
    node.style.flex = "none";
    node.style.minWidth = "0";
    node.style.overflow = "visible";
    node.style.textOverflow = "clip";
    node.style.whiteSpace = "nowrap";
    if (node.style.width.startsWith("var(")) {
      node.style.width = "max-content";
    }
    Array.from(node.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        relaxStretch(child);
      }
    });
  };
  clone.style.cssText =
    "position:fixed;left:-9999px;top:0;width:max-content;max-width:none;visibility:hidden;pointer-events:none;";
  relaxStretch(clone);
  document.body.appendChild(clone);
  const w = clone.scrollWidth;
  clone.remove();
  return w;
}

/** Intrinsic width for min-size — never cap by a squeezed or over-stretched parent column. */
function measureSocketRegionChildIntrinsicWidth(el: HTMLElement): number {
  if (
    el.hasAttribute("data-flow-socket-row") ||
    el.hasAttribute("data-flow-socket-live-preview") ||
    el.hasAttribute("data-flow-socket-label")
  ) {
    return measureElementUnstretchedScrollWidth(el);
  }
  if (el.scrollWidth > el.clientWidth + 1) {
    return el.scrollWidth;
  }
  if (el.clientWidth > 0 && el.offsetWidth < el.scrollWidth) {
    return el.scrollWidth;
  }
  return measureElementUnstretchedScrollWidth(el);
}

export function measureFlowNodeSocketRegionIntrinsicWidth(socketsEl: HTMLElement): {
  labels: number;
  previews: number;
  /** Widest socket row (preview + label + handle column), when rows are marked. */
  rows: number;
} {
  const labels = socketsEl.querySelectorAll<HTMLElement>("[data-flow-socket-label]");
  const previews = socketsEl.querySelectorAll<HTMLElement>(
    "[data-flow-socket-live-preview]",
  );
  const rows = socketsEl.querySelectorAll<HTMLElement>("[data-flow-socket-row]");
  let maxLabelW = 0;
  let maxPreviewW = 0;
  let maxRowW = 0;
  labels.forEach((el) => {
    maxLabelW = Math.max(maxLabelW, measureSocketRegionChildIntrinsicWidth(el));
  });
  previews.forEach((el) => {
    maxPreviewW = Math.max(
      maxPreviewW,
      measureSocketRegionChildIntrinsicWidth(el),
    );
  });
  rows.forEach((el) => {
    maxRowW = Math.max(maxRowW, measureSocketRegionChildIntrinsicWidth(el));
  });
  return { labels: maxLabelW, previews: maxPreviewW, rows: maxRowW };
}

/** Full socket row width (metadata chip + label + handle) without parent column squeeze. */
export function measureFlowNodeSocketRowIntrinsicWidth(rowEl: HTMLElement): number {
  return measureSocketRegionChildIntrinsicWidth(rowEl);
}

/** Widest row in a subgraph socket block, including region padding and handle chrome. */
export function measureSubgraphSocketRegionContentWidth(regionEl: HTMLElement): number {
  let maxRowW = 0;
  regionEl.querySelectorAll<HTMLElement>("[data-flow-socket-row]").forEach((row) => {
    maxRowW = Math.max(maxRowW, measureFlowNodeSocketRowIntrinsicWidth(row));
  });
  const style = getComputedStyle(regionEl);
  const padL = Number.parseFloat(style.paddingLeft) || 0;
  const padR = Number.parseFloat(style.paddingRight) || 0;
  return Math.ceil(maxRowW + padL + padR + FLOW_NODE_SOCKET_REGION_CHROME_PX);
}

/** Handle column + region padding folded into socket-region min width. */
export const FLOW_NODE_SOCKET_REGION_CHROME_PX = 46;

/** Gap between preview and label columns in aligned output live rows (`gap-x-2`). */
export const FLOW_NODE_SOCKET_PREVIEW_LABEL_GAP_PX = 8;

/** Label column width for equalizeLabelWidth — ignores stretched `w-full` parents. */
export function measureFlowNodeSocketLabelIntrinsicWidth(labelEl: HTMLElement): number {
  return measureElementUnstretchedScrollWidth(labelEl);
}

export function measureFlowNodeSocketPreviewIntrinsicWidth(
  previewEl: HTMLElement,
): number {
  return measureElementUnstretchedScrollWidth(previewEl);
}

export function measureFlowNodeSocketRegionLiveColumnWidths(socketsEl: HTMLElement): {
  preview: number;
  label: number;
} {
  let maxPreview = 0;
  let maxLabel = 0;
  socketsEl
    .querySelectorAll<HTMLElement>("[data-flow-socket-live-preview]")
    .forEach((el) => {
      maxPreview = Math.max(
        maxPreview,
        measureFlowNodeSocketPreviewIntrinsicWidth(el),
      );
    });
  socketsEl
    .querySelectorAll<HTMLElement>("[data-flow-socket-label]")
    .forEach((el) => {
      maxLabel = Math.max(maxLabel, measureFlowNodeSocketLabelIntrinsicWidth(el));
    });
  return {
    preview: maxPreview > 0 ? Math.ceil(maxPreview) : 0,
    label: maxLabel > 0 ? Math.ceil(maxLabel) : 0,
  };
}

export function resolveFlowNodeSocketRegionLiveWidthPx(socketsEl: HTMLElement): number {
  const { preview, label } = measureFlowNodeSocketRegionLiveColumnWidths(socketsEl);
  const gap = preview > 0 && label > 0 ? FLOW_NODE_SOCKET_PREVIEW_LABEL_GAP_PX : 0;
  return Math.ceil(preview + gap + label + FLOW_NODE_SOCKET_REGION_CHROME_PX);
}

export function resolveFlowNodeSocketRegionMinWidthPx(
  socketsEl: HTMLElement,
  options?: { labelOnly?: boolean },
): number {
  if (options?.labelOnly) {
    return resolveFlowNodeSocketRegionLabelOnlyWidthPx(socketsEl);
  }
  const intrinsic = measureFlowNodeSocketRegionIntrinsicWidth(socketsEl);
  const previews = socketsEl.querySelectorAll<HTMLElement>(
    "[data-flow-socket-live-preview]",
  );
  const liveColumnW =
    previews.length > 0 ? resolveFlowNodeSocketRegionLiveWidthPx(socketsEl) : 0;
  const rowW = Math.ceil(intrinsic.rows + FLOW_NODE_SOCKET_REGION_CHROME_PX);
  const labelW = Math.ceil(intrinsic.labels + FLOW_NODE_SOCKET_REGION_CHROME_PX);
  if (previews.length > 0) {
    return Math.max(liveColumnW, rowW, labelW);
  }
  return Math.max(rowW, labelW);
}

/** Label + handle only (live previews hidden) — never use stretched row / grid width. */
export function resolveFlowNodeSocketRegionLabelOnlyWidthPx(
  socketsEl: HTMLElement,
): number {
  const labels = socketsEl.querySelectorAll<HTMLElement>("[data-flow-socket-label]");
  let maxLabelW = 0;
  labels.forEach((el) => {
    maxLabelW = Math.max(maxLabelW, measureFlowNodeSocketLabelIntrinsicWidth(el));
  });
  return Math.ceil(maxLabelW + FLOW_NODE_SOCKET_REGION_CHROME_PX);
}

/** gap-2 between icon and title inside the leading column. */
const FLOW_NODE_HEADER_LEADING_INNER_GAP_PX = 8;
/** gap-2 between leading and trailing columns. */
const FLOW_NODE_HEADER_COLUMN_GAP_PX = 8;

function resolveFlowNodeHeaderShell(headerEl: HTMLElement): HTMLElement {
  if (headerEl.matches("[data-flow-node-header]")) {
    return headerEl;
  }
  return (
    headerEl.querySelector<HTMLElement>("[data-flow-node-header]") ?? headerEl
  );
}

function measureFlowNodeHeaderTitleTextWidth(titleEl: HTMLElement): number {
  const text = titleEl.textContent?.trim() ?? "";
  if (text.length === 0) {
    return 0;
  }
  const style = getComputedStyle(titleEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    return measureElementUnstretchedScrollWidth(titleEl);
  }
  const fontSize = style.fontSize || "13px";
  const fontFamily = style.fontFamily || "Inter, sans-serif";
  const fontWeight = style.fontWeight || "600";
  ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
  return Math.ceil(ctx.measureText(text).width);
}

/** Clone the measure row with both columns shrink-0 for a cross-check total. */
function measureFlowNodeHeaderRowUnstretchedWidth(
  measureRoot: HTMLElement,
): number {
  const clone = measureRoot.cloneNode(true) as HTMLElement;
  const relaxHeaderRow = (node: HTMLElement): void => {
    node.classList.remove(
      "w-full",
      "self-stretch",
      "flex-1",
      "min-w-0",
      "max-w-full",
      "truncate",
      "overflow-hidden",
    );
    node.style.width = "max-content";
    node.style.maxWidth = "none";
    node.style.flex = "none";
    node.style.flexShrink = "0";
    node.style.minWidth = "0";
    node.style.overflow = "visible";
    node.style.textOverflow = "clip";
    node.style.whiteSpace = "nowrap";
    Array.from(node.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        relaxHeaderRow(child);
      }
    });
  };
  clone.style.cssText =
    "position:fixed;left:-9999px;top:0;width:max-content;max-width:none;visibility:hidden;pointer-events:none;display:flex;align-items:center;gap:8px;";
  relaxHeaderRow(clone);
  document.body.appendChild(clone);
  const w = clone.scrollWidth;
  clone.remove();
  return w;
}

/**
 * Full title-bar width (icon + untruncated title + badges + padding).
 * Measures each piece off-DOM — never reads squeezed in-canvas flex columns.
 */
export function measureFlowNodeHeaderIntrinsicWidth(headerEl: HTMLElement): number {
  const headerShell = resolveFlowNodeHeaderShell(headerEl);
  const measureRoot =
    headerShell.querySelector<HTMLElement>("[data-flow-node-header-measure]") ??
    headerShell;
  const leadingEl = measureRoot.querySelector<HTMLElement>(
    "[data-flow-node-header-leading]",
  );
  const primaryEl = measureRoot.querySelector<HTMLElement>(
    "[data-flow-node-header-primary]",
  );
  const trailingEl = measureRoot.querySelector<HTMLElement>(
    "[data-flow-node-header-trailing]",
  );

  let leadingW = 0;
  if (leadingEl != null) {
    const iconEl =
      leadingEl.querySelector<HTMLElement>("[data-flow-node-header-icon]") ??
      leadingEl.querySelector<HTMLElement>(":scope > span");
    const iconW =
      iconEl != null ? measureElementUnstretchedScrollWidth(iconEl) : 0;
    const titleFromText =
      primaryEl != null ? measureFlowNodeHeaderTitleTextWidth(primaryEl) : 0;
    const titleFromClone =
      primaryEl != null ? measureElementUnstretchedScrollWidth(primaryEl) : 0;
    const titleW = Math.max(titleFromText, titleFromClone);
    const innerGap =
      iconW > 0 && titleW > 0 ? FLOW_NODE_HEADER_LEADING_INNER_GAP_PX : 0;
    leadingW = iconW + innerGap + titleW;
  }

  const trailingW =
    trailingEl != null ? measureElementUnstretchedScrollWidth(trailingEl) : 0;
  const columnGap =
    leadingW > 0 && trailingW > 0 ? FLOW_NODE_HEADER_COLUMN_GAP_PX : 0;
  const partsW = leadingW + columnGap + trailingW;
  const rowW = measureFlowNodeHeaderRowUnstretchedWidth(measureRoot);
  const contentW = Math.max(partsW, rowW);

  const style = getComputedStyle(headerShell);
  const padL = Number.parseFloat(style.paddingLeft) || 0;
  const padR = Number.parseFloat(style.paddingRight) || 0;
  return Math.ceil(contentW + padL + padR);
}
