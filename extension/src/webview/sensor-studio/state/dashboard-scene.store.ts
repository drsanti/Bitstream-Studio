import { create } from "zustand";
import {
  EMPTY_DASHBOARD_SNAPSHOT,
  type DashboardSnapshotV1,
} from "../core/dashboard/dashboard-snapshot";
import { areDashboardLiveSnapshotsEqual } from "../core/dashboard/dashboard-snapshot-live-equal";
import { readDashboardEditModeEnabled } from "../features/dashboard/dashboard-viewport-ui-persistence";

type DashboardSceneStore = {
  snapshot: DashboardSnapshotV1;
  highlightedWidgetSourceNodeId: string | null;
  activeTabSourceNodeId: string | null;
  editModeEnabled: boolean;
  setSnapshot: (snapshot: DashboardSnapshotV1) => void;
  setHighlightedWidgetSourceNodeId: (sourceNodeId: string | null) => void;
  setActiveTabSourceNodeId: (sourceNodeId: string | null) => void;
  setEditModeEnabled: (enabled: boolean) => void;
  resetSnapshot: () => void;
};

export const useDashboardSceneStore = create<DashboardSceneStore>((set) => ({
  snapshot: { ...EMPTY_DASHBOARD_SNAPSHOT },
  highlightedWidgetSourceNodeId: null,
  activeTabSourceNodeId: null,
  editModeEnabled: readDashboardEditModeEnabled(),
  setSnapshot: (snapshot) =>
    set((state) => {
      if (areDashboardLiveSnapshotsEqual(state.snapshot, snapshot)) {
        return state;
      }
      return { snapshot };
    }),
  setHighlightedWidgetSourceNodeId: (sourceNodeId) =>
    set({ highlightedWidgetSourceNodeId: sourceNodeId }),
  setActiveTabSourceNodeId: (sourceNodeId) => set({ activeTabSourceNodeId: sourceNodeId }),
  setEditModeEnabled: (editModeEnabled) => set({ editModeEnabled }),
  resetSnapshot: () =>
    set({
      snapshot: { ...EMPTY_DASHBOARD_SNAPSHOT },
      highlightedWidgetSourceNodeId: null,
      activeTabSourceNodeId: null,
    }),
}));
