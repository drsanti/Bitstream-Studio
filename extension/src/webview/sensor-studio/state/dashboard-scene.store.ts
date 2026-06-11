import { create } from "zustand";
import {
  EMPTY_DASHBOARD_SNAPSHOT,
  type DashboardSnapshotV1,
} from "../core/dashboard/dashboard-snapshot";
import { areDashboardLiveSnapshotsEqual } from "../core/dashboard/dashboard-snapshot-live-equal";
import { dashboardPrimaryHighlightedWidgetId } from "../core/dashboard/dashboard-widget-selection";
import {
  readDashboardDisplayTarget,
  readDashboardEditModeEnabled,
  readDashboardHighlightedWidgetSourceNodeIds,
  type DashboardDisplayTarget,
} from "../features/dashboard/dashboard-viewport-ui-persistence";

type DashboardSceneStore = {
  snapshot: DashboardSnapshotV1;
  /** Ordered selection — last id is the primary (resize / inspector anchor). */
  highlightedWidgetSourceNodeIds: string[];
  /** Primary selected widget — mirrors last entry in {@link highlightedWidgetSourceNodeIds}. */
  highlightedWidgetSourceNodeId: string | null;
  activeTabSourceNodeId: string | null;
  editModeEnabled: boolean;
  /** Preview/run surface — Dashboard pane or HUD overlay on Stage. */
  displayTarget: DashboardDisplayTarget;
  setSnapshot: (snapshot: DashboardSnapshotV1) => void;
  setHighlightedWidgetSelection: (sourceNodeIds: string[]) => void;
  setHighlightedWidgetSourceNodeId: (sourceNodeId: string | null) => void;
  setActiveTabSourceNodeId: (sourceNodeId: string | null) => void;
  setEditModeEnabled: (enabled: boolean) => void;
  setDisplayTarget: (target: DashboardDisplayTarget) => void;
  resetSnapshot: () => void;
};

function selectionStateFromIds(sourceNodeIds: string[]) {
  const highlightedWidgetSourceNodeIds = [...new Set(sourceNodeIds.filter(Boolean))];
  return {
    highlightedWidgetSourceNodeIds,
    highlightedWidgetSourceNodeId: dashboardPrimaryHighlightedWidgetId(
      highlightedWidgetSourceNodeIds,
    ),
  };
}

export const useDashboardSceneStore = create<DashboardSceneStore>((set) => ({
  snapshot: { ...EMPTY_DASHBOARD_SNAPSHOT },
  highlightedWidgetSourceNodeIds: readDashboardHighlightedWidgetSourceNodeIds(),
  highlightedWidgetSourceNodeId: dashboardPrimaryHighlightedWidgetId(
    readDashboardHighlightedWidgetSourceNodeIds(),
  ),
  activeTabSourceNodeId: null,
  editModeEnabled: readDashboardEditModeEnabled(),
  displayTarget: readDashboardDisplayTarget(),
  setSnapshot: (snapshot) =>
    set((state) => {
      if (areDashboardLiveSnapshotsEqual(state.snapshot, snapshot)) {
        return state;
      }
      return { snapshot };
    }),
  setHighlightedWidgetSelection: (sourceNodeIds) =>
    set(selectionStateFromIds(sourceNodeIds)),
  setHighlightedWidgetSourceNodeId: (sourceNodeId) =>
    set(selectionStateFromIds(sourceNodeId == null ? [] : [sourceNodeId])),
  setActiveTabSourceNodeId: (sourceNodeId) => set({ activeTabSourceNodeId: sourceNodeId }),
  setEditModeEnabled: (editModeEnabled) => set({ editModeEnabled }),
  setDisplayTarget: (displayTarget) => set({ displayTarget }),
  resetSnapshot: () =>
    set({
      snapshot: { ...EMPTY_DASHBOARD_SNAPSHOT },
      highlightedWidgetSourceNodeIds: [],
      highlightedWidgetSourceNodeId: null,
      activeTabSourceNodeId: null,
    }),
}));
