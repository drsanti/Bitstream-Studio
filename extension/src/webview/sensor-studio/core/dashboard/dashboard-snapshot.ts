import type { SensorHealthStatus } from "../../features/editor/store/flow-editor.store";

import type { DashboardGroupLayoutV1 } from "./dashboard-group-layout";

import type { DashboardLayoutV1 } from "./dashboard-layout";

import { dashboardOutputDefaultLayout } from "./dashboard-layout";

import type { DashboardFlexPlacementV1 } from "./dashboard-flex-placement";

import type { DashboardPlacementV1 } from "./dashboard-placement";

import type { DashboardThemeV1 } from "./dashboard-theme";

import { dashboardThemeDefault } from "./dashboard-theme";



export type DashboardWidgetKindV1 =
  | "button"
  | "led"
  | "text"
  | "gauge"
  | "bar"
  | "knob"
  | "switch"
  | "select"
  | "slider"
  | "status"
  | "formatted-text"
  | "image"
  | "sparkline"
  | "plotter";



export type DashboardWidgetEntryV1 = {

  widgetKind: DashboardWidgetKindV1;

  sourceNodeId: string;

  catalogNodeId: string;

  label: string;

  placement: DashboardPlacementV1;

  flexPlacement: DashboardFlexPlacementV1;

  style: Record<string, unknown>;

  liveValue: number | boolean | string | null;

  /** Sparkline history buffer (flow `liveHistory`). */
  liveHistory?: readonly number[];

  /** Plotter per-channel history (flow `livePlotHistory`). */
  livePlotHistory?: Readonly<Record<string, readonly number[]>>;

  /** Plotter channel handle order (defaults to ch1–ch4). */
  plotterChannelOrder?: readonly string[];

  sensorHealth?: SensorHealthStatus;

  enabled: boolean;

};



export type DashboardTabEntryV1 = {
  sourceNodeId: string;
  catalogNodeId: "dashboard-tab";
  label: string;
  /** Sort order in the tab bar (ascending). */
  order: number;
  items: DashboardSnapshotItemV1[];
  enabled: boolean;
};

export type DashboardGroupEntryV1 = {

  sourceNodeId: string;

  catalogNodeId: "dashboard-group";

  label: string;

  placement: DashboardPlacementV1;

  flexPlacement: DashboardFlexPlacementV1;

  groupLayout: DashboardGroupLayoutV1;

  showTitle: boolean;

  showBorder: boolean;

  children: DashboardWidgetEntryV1[];

  style: Record<string, unknown>;

  enabled: boolean;

};



export type DashboardSnapshotItemV1 =

  | { kind: "widget"; widget: DashboardWidgetEntryV1 }

  | { kind: "group"; group: DashboardGroupEntryV1 };



export type DashboardSnapshotV1 = {

  version: 1;

  dashboardOutputNodeId: string | null;

  updatedAtMs: number;

  layout: DashboardLayoutV1;

  theme: DashboardThemeV1;

  items: DashboardSnapshotItemV1[];

  /** Multi-page HMI — when non-empty, `items` is empty and each tab owns its own grid. */
  tabs: DashboardTabEntryV1[];

  /** @deprecated Use `items` — kept for overlap helpers during migration. */

  widgets: DashboardWidgetEntryV1[];

  layoutWarnings: string[];

};



export const EMPTY_DASHBOARD_SNAPSHOT: DashboardSnapshotV1 = {

  version: 1,

  dashboardOutputNodeId: null,

  updatedAtMs: 0,

  layout: dashboardOutputDefaultLayout(),

  theme: dashboardThemeDefault(),

  items: [],

  tabs: [],

  widgets: [],

  layoutWarnings: [],

};


