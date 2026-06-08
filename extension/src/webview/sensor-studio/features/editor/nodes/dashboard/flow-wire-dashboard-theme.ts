import {
  coerceDashboardThemeV1,
  type DashboardThemeV1,
} from "../../../../core/dashboard/dashboard-theme";

export type FlowWireDashboardThemeV1 = DashboardThemeV1;

export function isFlowWireDashboardThemeV1(v: unknown): v is FlowWireDashboardThemeV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireDashboardThemeV1).version === 1 &&
    typeof (v as FlowWireDashboardThemeV1).canvasBackground === "string"
  );
}

export function coerceFlowWireDashboardThemeV1(raw: unknown): FlowWireDashboardThemeV1 {
  return coerceDashboardThemeV1(raw);
}

export function flowValueAsDashboardTheme(v: unknown): FlowWireDashboardThemeV1 | null {
  if (!isFlowWireDashboardThemeV1(v)) {
    return null;
  }
  return coerceFlowWireDashboardThemeV1(v);
}
