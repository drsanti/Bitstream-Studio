/** Dashboard widget catalog ids that can be placed from the grid editor. */
export type DashboardWidgetCatalogId =
  | "dashboard-button"
  | "dashboard-led"
  | "dashboard-text"
  | "dashboard-gauge"
  | "dashboard-knob"
  | "dashboard-switch"
  | "dashboard-select"
  | "dashboard-formatted-text"
  | "dashboard-image"
  | "dashboard-slider"
  | "dashboard-status"
  | "dashboard-group"
  | "bar-meter"
  | "sparkline"
  | "plotter"
  | "dashboard-tab";

export type DashboardWidgetPaletteEntry = {
  catalogNodeId: DashboardWidgetCatalogId;
  label: string;
  description: string;
  /** Flow output node published to Dashboard (no Widget wire). */
  publishToDashboard?: boolean;
  /** Tab page container wired to Dashboard Output Tabs. */
  isTabPage?: boolean;
};

export const DASHBOARD_WIDGET_PALETTE: readonly DashboardWidgetPaletteEntry[] = [
  {
    catalogNodeId: "dashboard-button",
    label: "Button",
    description: "Operator click button with event output",
  },
  {
    catalogNodeId: "dashboard-text",
    label: "Text readout",
    description: "Numeric value with optional status bar",
  },
  {
    catalogNodeId: "dashboard-gauge",
    label: "Gauge",
    description: "Radial gauge for a wired number",
  },
  {
    catalogNodeId: "dashboard-knob",
    label: "Knob",
    description: "Interactive rotary control",
  },
  {
    catalogNodeId: "dashboard-slider",
    label: "Slider",
    description: "Horizontal numeric slider",
  },
  {
    catalogNodeId: "dashboard-switch",
    label: "Switch",
    description: "Boolean toggle with output",
  },
  {
    catalogNodeId: "dashboard-select",
    label: "Select",
    description: "Dropdown with string output",
  },
  {
    catalogNodeId: "dashboard-formatted-text",
    label: "Formatted text",
    description: "Template readout with {{value}} placeholders",
  },
  {
    catalogNodeId: "dashboard-image",
    label: "Image tile",
    description: "Static or wired image URL",
  },
  {
    catalogNodeId: "bar-meter",
    label: "Bar meter",
    description: "Publish a flow bar meter on the grid",
    publishToDashboard: true,
  },
  {
    catalogNodeId: "sparkline",
    label: "Sparkline",
    description: "Publish a flow sparkline trend on the grid",
    publishToDashboard: true,
  },
  {
    catalogNodeId: "plotter",
    label: "Plotter",
    description: "Publish a multi-channel plotter on the grid",
    publishToDashboard: true,
  },
  {
    catalogNodeId: "dashboard-tab",
    label: "Tab page",
    description: "Add a tab page to Dashboard Output",
    isTabPage: true,
  },
  {
    catalogNodeId: "dashboard-led",
    label: "LED",
    description: "On/off indicator lamp",
  },
  {
    catalogNodeId: "dashboard-status",
    label: "Status pill",
    description: "OK / fault status pill",
  },
  {
    catalogNodeId: "dashboard-group",
    label: "Group",
    description: "Nested grid container for child widgets",
  },
];

export const DASHBOARD_ADDABLE_CATALOG_IDS = new Set<string>(
  DASHBOARD_WIDGET_PALETTE.filter(
    (entry) => entry.publishToDashboard !== true && entry.isTabPage !== true,
  ).map((entry) => entry.catalogNodeId),
);

export const DASHBOARD_PLACEABLE_CATALOG_IDS = new Set<string>(
  DASHBOARD_WIDGET_PALETTE.map((entry) => entry.catalogNodeId),
);
