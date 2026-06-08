import type { CSSProperties } from "react";
import type { DashboardGridResizeHandleKind } from "../../core/dashboard/dashboard-grid-resize";

export const DASHBOARD_GRID_CORNER_HANDLE_PX = 12;
export const DASHBOARD_GRID_CORNER_HIT_PX = 22;
export const DASHBOARD_GRID_EDGE_BAR_LONG_PX = 36;
export const DASHBOARD_GRID_EDGE_BAR_SHORT_PX = 8;
export const DASHBOARD_GRID_EDGE_HIT_PX = 20;

export type DashboardGridResizeHandleSpec = {
  kind: DashboardGridResizeHandleKind;
  cursor: string;
  style: CSSProperties;
  hitStyle: CSSProperties;
  variant: "corner" | "edge";
};

export const DASHBOARD_GRID_RESIZE_HANDLES: DashboardGridResizeHandleSpec[] = [
  {
    kind: "nw",
    cursor: "nwse-resize",
    variant: "corner",
    style: { left: 0, top: 0, transform: "translate(-50%, -50%)" },
    hitStyle: { left: 0, top: 0, transform: "translate(-50%, -50%)" },
  },
  {
    kind: "n",
    cursor: "ns-resize",
    variant: "edge",
    style: { left: "50%", top: 0, transform: "translate(-50%, -50%)" },
    hitStyle: { left: "50%", top: 0, transform: "translate(-50%, -50%)" },
  },
  {
    kind: "ne",
    cursor: "nesw-resize",
    variant: "corner",
    style: { right: 0, top: 0, transform: "translate(50%, -50%)" },
    hitStyle: { right: 0, top: 0, transform: "translate(50%, -50%)" },
  },
  {
    kind: "w",
    cursor: "ew-resize",
    variant: "edge",
    style: { left: 0, top: "50%", transform: "translate(-50%, -50%)" },
    hitStyle: { left: 0, top: "50%", transform: "translate(-50%, -50%)" },
  },
  {
    kind: "e",
    cursor: "ew-resize",
    variant: "edge",
    style: { right: 0, top: "50%", transform: "translate(50%, -50%)" },
    hitStyle: { right: 0, top: "50%", transform: "translate(50%, -50%)" },
  },
  {
    kind: "sw",
    cursor: "nesw-resize",
    variant: "corner",
    style: { left: 0, bottom: 0, transform: "translate(-50%, 50%)" },
    hitStyle: { left: 0, bottom: 0, transform: "translate(-50%, 50%)" },
  },
  {
    kind: "s",
    cursor: "ns-resize",
    variant: "edge",
    style: { left: "50%", bottom: 0, transform: "translate(-50%, 50%)" },
    hitStyle: { left: "50%", bottom: 0, transform: "translate(-50%, 50%)" },
  },
  {
    kind: "se",
    cursor: "nwse-resize",
    variant: "corner",
    style: { right: 0, bottom: 0, transform: "translate(50%, 50%)" },
    hitStyle: { right: 0, bottom: 0, transform: "translate(50%, 50%)" },
  },
];

export function dashboardGridResizeHandleDimensions(
  handle: DashboardGridResizeHandleSpec,
): { width: number; height: number } {
  if (handle.variant === "corner") {
    return {
      width: DASHBOARD_GRID_CORNER_HANDLE_PX,
      height: DASHBOARD_GRID_CORNER_HANDLE_PX,
    };
  }
  if (handle.kind === "n" || handle.kind === "s") {
    return {
      width: DASHBOARD_GRID_EDGE_BAR_LONG_PX,
      height: DASHBOARD_GRID_EDGE_BAR_SHORT_PX,
    };
  }
  return {
    width: DASHBOARD_GRID_EDGE_BAR_SHORT_PX,
    height: DASHBOARD_GRID_EDGE_BAR_LONG_PX,
  };
}

export function dashboardGridResizeHandleHitDimensions(
  handle: DashboardGridResizeHandleSpec,
): { width: number; height: number } {
  if (handle.variant === "corner") {
    return {
      width: DASHBOARD_GRID_CORNER_HIT_PX,
      height: DASHBOARD_GRID_CORNER_HIT_PX,
    };
  }
  if (handle.kind === "n" || handle.kind === "s") {
    return {
      width: DASHBOARD_GRID_EDGE_BAR_LONG_PX + 8,
      height: DASHBOARD_GRID_EDGE_HIT_PX,
    };
  }
  return {
    width: DASHBOARD_GRID_EDGE_HIT_PX,
    height: DASHBOARD_GRID_EDGE_BAR_LONG_PX + 8,
  };
}
