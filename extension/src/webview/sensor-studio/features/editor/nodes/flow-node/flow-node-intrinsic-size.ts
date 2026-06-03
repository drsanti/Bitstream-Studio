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

export function measureFlowNodeSocketRegionIntrinsicWidth(socketsEl: HTMLElement): {
  labels: number;
  previews: number;
} {
  const labels = socketsEl.querySelectorAll<HTMLElement>("[data-flow-socket-label]");
  const previews = socketsEl.querySelectorAll<HTMLElement>(
    "[data-flow-socket-live-preview]",
  );
  let maxLabelW = 0;
  let maxPreviewW = 0;
  labels.forEach((el) => {
    maxLabelW = Math.max(maxLabelW, el.scrollWidth);
  });
  previews.forEach((el) => {
    // Previews use `w-fit` + truncate; cap by client box if the row stretched.
    const w = Math.min(el.scrollWidth, el.clientWidth > 0 ? el.clientWidth : el.scrollWidth);
    maxPreviewW = Math.max(maxPreviewW, w);
  });
  return { labels: maxLabelW, previews: maxPreviewW };
}

function measureElementUnstretchedScrollWidth(el: HTMLElement): number {
  if (el.scrollWidth > el.clientWidth + 1) {
    return el.scrollWidth;
  }
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText =
    "position:fixed;left:-9999px;top:0;width:max-content;max-width:none;visibility:hidden;pointer-events:none;";
  el.parentElement?.appendChild(clone);
  const w = clone.scrollWidth;
  clone.remove();
  return w;
}

/** Icon + gap-2 before the title inside `data-flow-node-header-leading`. */
export function measureFlowNodeHeaderLeadingIconWidth(
  titleEl: HTMLElement | null,
): number {
  const leading = titleEl?.closest<HTMLElement>("[data-flow-node-header-leading]");
  if (leading == null) {
    return 0;
  }
  const icon = leading.querySelector<HTMLElement>(":scope > span");
  if (icon == null) {
    return 0;
  }
  return Math.ceil(icon.getBoundingClientRect().width) + 8;
}

export function measureFlowNodeHeaderTitleIntrinsicWidth(
  titleEl: HTMLElement | null,
): number {
  if (titleEl == null) {
    return 0;
  }
  const scrollW = titleEl.scrollWidth;
  const clientW = titleEl.clientWidth;
  const primaryWrap = titleEl.parentElement;
  const parentW = primaryWrap?.clientWidth ?? 0;
  if (
    parentW > 0 &&
    clientW >= Math.floor(parentW * STRETCH_FILL_RATIO)
  ) {
    return measureElementUnstretchedScrollWidth(titleEl);
  }
  return Math.min(scrollW, clientW > 0 ? clientW : scrollW);
}
