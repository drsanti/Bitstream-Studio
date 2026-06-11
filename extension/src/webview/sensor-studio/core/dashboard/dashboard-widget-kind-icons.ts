import {
  Activity,
  BarChart3,
  ChartLine,
  Circle,
  Disc3,
  FileText,
  Gauge,
  Image,
  LineChart,
  List,
  MousePointerClick,
  SlidersHorizontal,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { DashboardWidgetKindV1 } from "./dashboard-snapshot";

export const DASHBOARD_WIDGET_KIND_ICONS: Record<DashboardWidgetKindV1, LucideIcon> = {
  button: MousePointerClick,
  led: Circle,
  text: Type,
  "formatted-text": FileText,
  image: Image,
  gauge: Gauge,
  bar: BarChart3,
  knob: Disc3,
  switch: ToggleLeft,
  select: List,
  slider: SlidersHorizontal,
  status: Activity,
  sparkline: LineChart,
  plotter: ChartLine,
};

export function dashboardWidgetKindIcon(kind: DashboardWidgetKindV1): LucideIcon {
  return DASHBOARD_WIDGET_KIND_ICONS[kind];
}
