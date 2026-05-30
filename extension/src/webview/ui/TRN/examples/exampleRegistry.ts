export type ExampleRegistryItem<TId extends string = string> = {
  id: TId;
  label: string;
};

export type ExampleGroup =
  | "container"
  | "window"
  | "toolbox-panel"
  | "card"
  | "tabs"
  | "split-pane"
  | "command-palette"
  | "data-grid"
  | "tree"
  | "form"
  | "app-layout"
  | "side-panel"
  | "sortable"
  | "sortable-card"
  | "accordion";

export const TRN_CONTAINER_EXAMPLE_TABS = [
  { id: "fill-stack", label: "Fill + Stack + ScrollY" },
  { id: "fit-minimal", label: "Fit + Minimal" },
  { id: "direction", label: "Direction (row/column)" },
  { id: "scroll", label: "Scroll (x/y/both)" },
  { id: "gap-matrix", label: "Gap Matrix" },
  { id: "cols", label: "Grid Cols 1/2/3/4/6/12" },
  { id: "native-props", label: "Native Props" },
  { id: "ref", label: "Ref Usage" },
  { id: "nested", label: "Nested Containers" },
  { id: "wrap", label: "Wrap (row)" },
  { id: "split-row", label: "Flex Split Row" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_WINDOW_EXAMPLE_TABS = [
  { id: "basic-modal", label: "Basic Modal Window" },
  { id: "non-modal", label: "Non-Modal Floating" },
  { id: "reopen-strategy", label: "Reopen Strategy" },
  { id: "constraints", label: "Size / Drag Constraints" },
  { id: "icons-title", label: "Title Prefix Icons" },
  { id: "bounded-parent", label: "Bounded (Parent)" },
  { id: "bounded-auto-height", label: "Bounded + Auto Height" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_TOOLBOX_PANEL_EXAMPLE_TABS = [
  { id: "bounded-scene", label: "Bounded 3D-style scene" },
  { id: "pin-escape", label: "Pin glass + Esc" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_CARD_EXAMPLE_TABS = [
  { id: "simple", label: "Simple Mode" },
  { id: "animated", label: "Animated Mode" },
  { id: "controlled", label: "Controlled State" },
  { id: "toggle-header", label: "Toggle On Header Click" },
  { id: "disabled", label: "Disabled Card" },
  { id: "collapsed-height", label: "Collapsed Height + Easing" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_TABS_EXAMPLE_TABS = [
  { id: "basic", label: "Basic Tabs" },
  { id: "controlled", label: "Controlled + Lazy Mount" },
  { id: "vertical", label: "Vertical + Keyboard" },
  { id: "rail", label: "Rail (Left/Right)" },
  { id: "animation", label: "Animation Tuning" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_SPLIT_PANE_EXAMPLE_TABS = [
  { id: "horizontal", label: "Horizontal Split" },
  { id: "vertical", label: "Vertical Split" },
  { id: "two-cols", label: "2 Columns" },
  { id: "two-rows", label: "2 Rows" },
  { id: "quad-grid", label: "Nested 2x2 Grid" },
  { id: "workbench", label: "Workbench (Sidebar/Main/Console)" },
  { id: "ide", label: "IDE Layout" },
  { id: "monitoring", label: "Monitoring Layout" },
  { id: "persist", label: "Persisted + Reset" },
  { id: "controlled", label: "Controlled Size" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_SORTABLE_EXAMPLE_TABS = [
  { id: "vertical", label: "Vertical List" },
  { id: "horizontal", label: "Horizontal Row" },
  { id: "grid", label: "Grid Layout" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_SORTABLE_CARD_EXAMPLE_TABS = [
  { id: "basic", label: "Basic Sortable Cards" },
  { id: "sidebar", label: "Sidebar Style" },
  { id: "playful", label: "Playful Drag FX" },
  { id: "collapsible", label: "Collapsible true/false" },
  { id: "custom-slot", label: "Custom Right Slot" },
  { id: "sortable-disabled", label: "Sortable Disabled" },
  { id: "no-handle", label: "No Handle Mode" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_ACCORDION_EXAMPLE_TABS = [
  { id: "single", label: "Single Open" },
  { id: "multiple", label: "Multiple Open" },
  { id: "controlled", label: "Controlled Value" },
  { id: "disabled", label: "Disabled Item" },
  { id: "animation", label: "Animation Tuning" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_COMMAND_PALETTE_EXAMPLE_TABS = [
  { id: "basic", label: "Basic Items" },
  { id: "grouped", label: "Grouped" },
  { id: "shortcuts", label: "With Shortcuts" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_DATA_GRID_EXAMPLE_TABS = [
  { id: "basic", label: "Basic" },
  { id: "sort", label: "Sort" },
  { id: "resize", label: "Resize" },
  { id: "custom", label: "Custom cells" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_TREE_EXAMPLE_TABS = [
  { id: "basic", label: "Basic list" },
  { id: "nested", label: "Nested" },
  { id: "controlled", label: "Controlled expand" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_FORM_EXAMPLE_TABS = [
  { id: "section", label: "Section + field" },
  { id: "inline", label: "Inline edit" },
  { id: "validation", label: "Validation" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_APP_LAYOUT_EXAMPLE_TABS = [
  { id: "stack-default", label: "Stack Default" },
  { id: "workbench-sidebar", label: "Workbench Sidebar" },
  { id: "split-console", label: "Split Console" },
  { id: "focus-rail", label: "Focus Rail" },
  { id: "monitor-wall", label: "Monitor Wall" },
  { id: "dense-dual", label: "Dense Dual" },
  { id: "mobile-first", label: "Mobile First" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export const TRN_SIDE_PANEL_EXAMPLE_TABS = [
  { id: "right-docked", label: "Right Docked" },
  { id: "left-docked", label: "Left Docked" },
  { id: "overlay-glass", label: "Overlay Glass" },
  { id: "floating-anchor", label: "Floating Anchor" },
  { id: "controlled-toggle", label: "Controlled + Toggle Reason" },
  { id: "state-matrix", label: "State Matrix" },
] as const satisfies ReadonlyArray<ExampleRegistryItem>;

export type TRNContainerExampleTab = (typeof TRN_CONTAINER_EXAMPLE_TABS)[number]["id"];
export type TRNWindowExampleTab = (typeof TRN_WINDOW_EXAMPLE_TABS)[number]["id"];
export type TRNToolboxPanelExampleTab =
  (typeof TRN_TOOLBOX_PANEL_EXAMPLE_TABS)[number]["id"];
export type TRNCardExampleTab = (typeof TRN_CARD_EXAMPLE_TABS)[number]["id"];
export type TRNTabsExampleTab = (typeof TRN_TABS_EXAMPLE_TABS)[number]["id"];
export type TRNSplitPaneExampleTab =
  (typeof TRN_SPLIT_PANE_EXAMPLE_TABS)[number]["id"];
export type TRNSortableExampleTab = (typeof TRN_SORTABLE_EXAMPLE_TABS)[number]["id"];
export type TRNSortableCardExampleTab =
  (typeof TRN_SORTABLE_CARD_EXAMPLE_TABS)[number]["id"];
export type TRNAccordionExampleTab =
  (typeof TRN_ACCORDION_EXAMPLE_TABS)[number]["id"];
export type TRNCommandPaletteExampleTab =
  (typeof TRN_COMMAND_PALETTE_EXAMPLE_TABS)[number]["id"];
export type TRNDataGridExampleTab = (typeof TRN_DATA_GRID_EXAMPLE_TABS)[number]["id"];
export type TRNTreeExampleTab = (typeof TRN_TREE_EXAMPLE_TABS)[number]["id"];
export type TRNFormExampleTab = (typeof TRN_FORM_EXAMPLE_TABS)[number]["id"];
export type TRNAppLayoutExampleTab =
  (typeof TRN_APP_LAYOUT_EXAMPLE_TABS)[number]["id"];
export type TRNSidePanelExampleTab =
  (typeof TRN_SIDE_PANEL_EXAMPLE_TABS)[number]["id"];

export type TRNExampleCatalogItem = {
  id: string;
  label: string;
  description: string;
  group: ExampleGroup;
  tags: string[];
  targetTab:
    | TRNContainerExampleTab
    | TRNWindowExampleTab
    | TRNToolboxPanelExampleTab
    | TRNCardExampleTab
    | TRNTabsExampleTab
    | TRNSplitPaneExampleTab
    | TRNCommandPaletteExampleTab
    | TRNDataGridExampleTab
    | TRNTreeExampleTab
    | TRNFormExampleTab
    | TRNAppLayoutExampleTab
    | TRNSidePanelExampleTab
    | TRNSortableExampleTab
    | TRNSortableCardExampleTab
    | TRNAccordionExampleTab;
};

export const TRN_EXAMPLE_CATALOG_ITEMS: readonly TRNExampleCatalogItem[] = [
  ...TRN_CONTAINER_EXAMPLE_TABS.map((item) => ({
    id: `container:${item.id}`,
    label: item.label,
    description: `TRNContainer example: ${item.label}`,
    group: "container" as const,
    tags: ["container", "layout", "trn"],
    targetTab: item.id,
  })),
  ...TRN_WINDOW_EXAMPLE_TABS.map((item) => ({
    id: `window:${item.id}`,
    label: item.label,
    description: `TRNWindow example: ${item.label}`,
    group: "window" as const,
    tags: ["window", "dialog", "trn"],
    targetTab: item.id,
  })),
  ...TRN_TOOLBOX_PANEL_EXAMPLE_TABS.map((item) => ({
    id: `toolbox-panel:${item.id}`,
    label: item.label,
    description: `TRNToolboxPanel example: ${item.label}`,
    group: "toolbox-panel" as const,
    tags: ["toolbox", "overlay", "3d", "trn"],
    targetTab: item.id,
  })),
  ...TRN_CARD_EXAMPLE_TABS.map((item) => ({
    id: `card:${item.id}`,
    label: item.label,
    description: `TRNCard example: ${item.label}`,
    group: "card" as const,
    tags: ["card", "collapse", "trn"],
    targetTab: item.id,
  })),
  ...TRN_TABS_EXAMPLE_TABS.map((item) => ({
    id: `tabs:${item.id}`,
    label: item.label,
    description: `TRNTabs example: ${item.label}`,
    group: "tabs" as const,
    tags: ["tabs", "navigation", "trn"],
    targetTab: item.id,
  })),
  ...TRN_SPLIT_PANE_EXAMPLE_TABS.map((item) => ({
    id: `split-pane:${item.id}`,
    label: item.label,
    description: `TRNSplitPane example: ${item.label}`,
    group: "split-pane" as const,
    tags: ["split", "resize", "layout", "trn"],
    targetTab: item.id,
  })),
  ...TRN_COMMAND_PALETTE_EXAMPLE_TABS.map((item) => ({
    id: `command-palette:${item.id}`,
    label: item.label,
    description: `TRNCommandPalette example: ${item.label}`,
    group: "command-palette" as const,
    tags: ["command", "palette", "search", "trn"],
    targetTab: item.id,
  })),
  ...TRN_DATA_GRID_EXAMPLE_TABS.map((item) => ({
    id: `data-grid:${item.id}`,
    label: item.label,
    description: `TRNDataGrid example: ${item.label}`,
    group: "data-grid" as const,
    tags: ["table", "grid", "sort", "trn"],
    targetTab: item.id,
  })),
  ...TRN_TREE_EXAMPLE_TABS.map((item) => ({
    id: `tree:${item.id}`,
    label: item.label,
    description: `TRNTree example: ${item.label}`,
    group: "tree" as const,
    tags: ["tree", "hierarchy", "trn"],
    targetTab: item.id,
  })),
  ...TRN_FORM_EXAMPLE_TABS.map((item) => ({
    id: `form:${item.id}`,
    label: item.label,
    description: `TRNForm example: ${item.label}`,
    group: "form" as const,
    tags: ["form", "input", "trn"],
    targetTab: item.id,
  })),
  ...TRN_APP_LAYOUT_EXAMPLE_TABS.map((item) => ({
    id: `app-layout:${item.id}`,
    label: item.label,
    description: `App layout example: ${item.label}`,
    group: "app-layout" as const,
    tags: ["app", "layout", "workbench", "trn"],
    targetTab: item.id,
  })),
  ...TRN_SIDE_PANEL_EXAMPLE_TABS.map((item) => ({
    id: `side-panel:${item.id}`,
    label: item.label,
    description: `TRNSidePanel example: ${item.label}`,
    group: "side-panel" as const,
    tags: ["side-panel", "overlay", "resize", "trn"],
    targetTab: item.id,
  })),
  ...TRN_SORTABLE_EXAMPLE_TABS.map((item) => ({
    id: `sortable:${item.id}`,
    label: item.label,
    description: `TRNSortable example: ${item.label}`,
    group: "sortable" as const,
    tags: ["sortable", "drag", "reorder", "trn"],
    targetTab: item.id,
  })),
  ...TRN_SORTABLE_CARD_EXAMPLE_TABS.map((item) => ({
    id: `sortable-card:${item.id}`,
    label: item.label,
    description: `TRNSortableCard example: ${item.label}`,
    group: "sortable-card" as const,
    tags: ["sortable-card", "drag", "card", "trn"],
    targetTab: item.id,
  })),
  ...TRN_ACCORDION_EXAMPLE_TABS.map((item) => ({
    id: `accordion:${item.id}`,
    label: item.label,
    description: `TRNAccordion example: ${item.label}`,
    group: "accordion" as const,
    tags: ["accordion", "collapse", "trn"],
    targetTab: item.id,
  })),
];
