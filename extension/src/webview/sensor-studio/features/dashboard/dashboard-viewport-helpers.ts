import { NODE_CATALOG_DEFAULTS } from "../../config/node-catalog.config";
import type { StudioDemoTemplateId } from "../editor/store/flow-editor.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

export const DASHBOARD_DEMO_TEMPLATE_ID: StudioDemoTemplateId = "dashboard-controls-demo";

export function runDashboardDemoTemplate(): void {
  const catalog = NODE_CATALOG_DEFAULTS.payload.nodes;
  useFlowEditorStore.getState().runDemoTemplate(DASHBOARD_DEMO_TEMPLATE_ID, catalog);
}
