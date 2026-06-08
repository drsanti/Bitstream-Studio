import { useDashboardSceneStore } from "../../state/dashboard-scene.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

export type DashboardNavigatePayload = {
  sourceNodeId?: string | null;
};

export function focusDashboardPane(focusWorkbenchPane: (editorType: string) => void): void {
  focusWorkbenchPane("dashboard");
}

export function openDashboard(
  focusWorkbenchPane: (editorType: string) => void,
  payload: DashboardNavigatePayload = {},
): void {
  const sourceNodeId = payload.sourceNodeId?.trim() ?? "";
  if (sourceNodeId.length > 0) {
    useDashboardSceneStore.getState().setHighlightedWidgetSourceNodeId(sourceNodeId);
    useFlowEditorStore.getState().onSelectionChange([sourceNodeId]);
  }
  focusDashboardPane(focusWorkbenchPane);
}

export const DASHBOARD_OPERATOR_WORKBENCH_PRESET_ID = "dashboard-operator";

export function openDashboardOperatorLayout(
  applyWorkbenchPreset: (presetId: string) => boolean,
  focusWorkbenchPane: (editorType: string) => void,
): void {
  applyWorkbenchPreset(DASHBOARD_OPERATOR_WORKBENCH_PRESET_ID);
  focusDashboardPane(focusWorkbenchPane);
}
