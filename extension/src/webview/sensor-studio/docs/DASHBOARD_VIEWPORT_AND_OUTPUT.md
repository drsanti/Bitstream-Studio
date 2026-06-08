# Dashboard viewport and Dashboard Output (2D HMI)

**Status:** F10 shipped (2026-06-07) — grid **resize handles**; **`dashboard-status`** + publish **`compare`** / **`indicator`** / **`threshold`**; **`dashboard-controls-demo`** starter.

**Reference:** Node-RED Dashboard (grid groups + widgets); Sensor Studio **Stage** + **Scene Output** parity for 3D.

## Roles

| Surface | Purpose |
| -------- | -------- |
| **Flow output nodes** (gauge, plotter, knob, …) | Engineering view — widgets live on the graph canvas for wiring and debug |
| **Dashboard widget nodes** (`dashboard-*`) | Operator widgets — placement + style in node config; render in the **Dashboard** pane |
| **Dashboard Output** (flow node) | Commit point — wired **Widgets** define what the **Dashboard** pane renders |
| **Dashboard** (workbench pane) | Full-bleed 2D operator HMI (CSS grid layout, TRN controls) |

## Independence from flow canvas widgets

The workbench **Dashboard** is **not** the flow canvas and does **not** mirror arbitrary output-node positions on the graph.

| Concern | Dashboard pane | Flow canvas output nodes |
| -------- | ---------------- | ------------------------ |
| Data source | `useDashboardSceneStore` ← `evaluateDashboardSnapshot()` reads **`dashboard-output`** + wired `dashboard-*` nodes + flow nodes with **`publishToDashboard`** | Each node's own card body + `liveValue` |
| Layout | Grid columns / gap / padding on **Dashboard Output**; per-widget `placement` | React Flow node position only |
| Interactions | Button click → `dispatchDashboardWidgetEvent` (Domain C) | **On Click** = empty flow canvas only |

## Workbench

- Registry editor type: **`dashboard`** — label **Dashboard**, icon LayoutGrid
- Layout presets: **Dashboard focus** (large Dashboard over thin Flow strip); **Dashboard operator** (full-screen Dashboard only)
- Command palette: **Open Dashboard** (when wired in workbench commands)
- Default layout unchanged (Stage over Flow); add **Dashboard** via pane picker or **Dashboard focus** preset

Persistence key unchanged: `ternion_workbench_sensor-studio`.

## Dashboard Output node

Catalog id: **`dashboard-output`** (category **dashboard**).

| Socket | Type | Role |
| ------ | ---- | ---- |
| **Widgets** | `dashboardWidget` | Wires from dashboard widgets or **`dashboard-group`** (single-page mode) |
| **Tabs** | `dashboardTab` | Wires from **`dashboard-tab`** nodes (multi-page mode — direct **Widgets** wires are ignored) |
| **Theme** | `dashboardTheme` | Optional wire from **`dashboard-theme`** (fallback preset on output node) |

**Defaults** (`core/dashboard/dashboard-layout.ts`): 12-column grid, 8px gap, 16px padding, `mode: grid`.

## Dashboard widget nodes

| Catalog id | Inputs | Outputs | Dashboard cell |
| ---------- | ------ | ------- | -------------- |
| **`dashboard-button`** | — | `widget`, `event` (Click) | TRN button |
| **`dashboard-led`** | `in` (boolean / number) | `widget` | LED (reuses led-indicator config) |
| **`dashboard-text`** | `in` (number) | `widget` | Numeric readout + optional label |
| **`dashboard-gauge`** | `in` (number) | `widget` | Radial gauge (reuses radial-gauge config) |
| **`dashboard-knob`** | — | `widget`, `out` (number) | Interactive knob (reuses knob config) |
| **`dashboard-switch`** | — | `widget`, `out` (boolean) | Boolean toggle (`TRNToggleSwitch`) |
| **`dashboard-slider`** | — | `widget`, `out` (number) | Horizontal slider + numeric readout |
| **`dashboard-status`** | `in` (boolean) | `widget` | Labeled status pill (configurable on/off labels + tones) |
| **`dashboard-group`** | `widgets` | `widget` | Nested grid container for child widgets |
| **`dashboard-tab`** | `widgets` | `tab` | Tab page — wire child widgets; wire **Tab** into Dashboard Output **Tabs** |
| **`dashboard-theme`** | — | `out` (theme) | Theme preset wire for Dashboard Output |

Each widget stores **`placement`** (grid mode) and **`flex`** (flex mode) in `defaultConfig`:

```json
{ "column": 1, "row": 1, "columnSpan": 2, "rowSpan": 1 }
{ "order": 0, "grow": 1, "shrink": 1, "basis": "auto" }
```

Grid is **1-based** (CSS grid line origin). Inspector **Placement** / **Flex placement** sections follow the committed **Dashboard Output** layout mode.

## Dashboard pane UX (F2)

- **Preview / Edit** toolbar (`DashboardViewportToolbar`) — persisted in `localStorage`.
- **Edit** mode — segmented **Preview / Edit** toolbar; contextual edit bar (selection label, placement readout, deselect); auto-selects the first widget when entering Edit; **drag a widget** to snap it to a grid cell (live preview while dragging); **eight cyan resize handles** (edges + corners) on the selection frame; click empty grid to deselect; **Stack** arranges visible widgets in column 1.
- **Live data in Edit** — unlike Stage **Edit** (which freezes the 3D snapshot), Dashboard **Edit** keeps **live widget values** updating during layout work: widgets read the **live store** (`use-dashboard-widget-live.ts`) each tick; **structural** layout (grid, widget list, warnings) refreshes via **`evaluateDashboardSnapshot`** on graph/layout changes only (`use-dashboard-structural-snapshot.ts`). Gauges, text, LEDs, sparklines, and plotters show live upstream values while you move or resize widgets. Only **controls** (button, knob, switch, slider) are disabled in Edit so layout handles win pointer events.
- **`DashboardOpenLink`** — inspector / output section shortcut to focus the Dashboard pane and highlight a widget (`openDashboard()`).

## Evaluation (Domain F)

On **structural** graph/layout changes (and import/hydrate):

1. `evaluateDashboardSnapshot({ nodes, edges })` in `core/dashboard/evaluate-dashboard-snapshot.ts`
2. Result stored in `useDashboardSceneStore` → **DashboardViewport** reads committed layout

**Per-tick** widget values come from **`useFlowNodeLiveStore`** (patched in `tickSimulation`) via **`use-dashboard-widget-live.ts`**, not a full snapshot re-eval every frame. Overlap detection runs in the evaluator (warnings in snapshot `layoutWarnings`). See **`SENSOR_STUDIO_PERFORMANCE.md`** § Dashboard live vs structural snapshot.

## Events (Domain C)

**Dashboard Button** click in the pane calls `dispatchDashboardWidgetEvent(sourceNodeId)` → fires wired **event** outputs (same path as **On Key** / **On Stage Pick**).

## Demo template

Canvas inspector → **Starter template** → **Dashboard + button** → **Run template**.

Spawns **Sine Wave** → **Dashboard Text** + **Dashboard Gauge**, **Dashboard Button** → **Set Boolean** → **Dashboard LED**, all wired to **Dashboard Output**. Open the **Dashboard** pane to operate.

Template ids: **`dashboard-controls-demo`** (recommended starter — switch, slider, status, button/LED); **`dashboard-button-led`** (minimal wired widgets); **`dashboard-publish-demo`** (publish flow outputs); **`dashboard-tabs-demo`** (two **Dashboard Tab** pages + published sparkline).

## Publish-to-dashboard (F4)

Flow output / control nodes can mirror onto the Dashboard **without** duplicating `dashboard-*` nodes or Widget wires.

| Catalog id | Dashboard cell | Inspector |
| ---------- | -------------- | --------- |
| **`radial-gauge`** | Radial gauge | **Dashboard** section → **Show on Dashboard** + placement |
| **`led-indicator`** | LED | same |
| **`numeric-display`** | Numeric readout | same |
| **`knob`** | Interactive knob | same |
| **`bar-meter`** | Bar meter | same |
| **`sparkline`** | Sparkline trend | same + optional **Dashboard group** |
| **`plotter`** | Multi-channel plotter | same + optional **Dashboard group** |
| **`compare`** | Status pill | **Dashboard** section + on/off labels and tones |
| **`indicator`** | Status pill | same |
| **`threshold`** | Status pill | same |

When **`publishToDashboard`** is true and a **`dashboard-output`** node exists, the evaluator appends the node to snapshot `items` (wired widgets win on duplicate `sourceNodeId`). Set **`dashboardGroupId`** to a wired **`dashboard-group`** flow id to nest inside that group's grid (placement is scoped to the group).

## Inspector

| Focus / selection | Inspector |
| ----------------- | --------- |
| **Dashboard pane** (no flow node selected) | **Dashboard Inspector** — Overview (tab switcher, overlap warnings, Preview/Edit), Widgets list, **Controls** mirror (incl. mini plotter), Layout tab (grid/theme + warnings) |
| **Dashboard widget** on pane | Flow node inspector + **Dashboard selection** strip |
| **Dashboard Output** (flow node) | Layout mode (grid / flex), spacing, **Open Dashboard** link |
| **Dashboard widget** (flow node) | Placement or flex fields + widget-specific sections + **Open Dashboard** link |
| **Flow gauge / LED / numeric / knob** | Widget-specific sections + **Dashboard** publish section |

## Operator layout (F4)

- Workbench preset **`dashboard-operator`** — single full-bleed **Dashboard** pane (no flow, library, or inspector).
- **Dashboard** pane toolbar → **Operator** applies the preset and focuses Dashboard (`openDashboardOperatorLayout()`).

## Phased backlog

| Phase | Scope |
| ----- | ----- |
| **F0** | This doc + Domain F in `FLOW_DOMAINS.md` — **done** |
| **F1** | Pane + output node + button / LED / text + evaluator + demo — **done** |
| **F2** | Gauge / knob; edit-mode grid overlay; flex root layout; `DashboardOpenLink` — **done** |
| **F3** | `dashboard-group` nested grid; `dashboard-theme` wire — **done** |
| **F4** | Publish-to-dashboard on existing output nodes; full-screen operator preset — **done** |
| **F5** | **`bar-meter`** publish; **`dashboard-publish-demo`** template; workbench **Open Dashboard** command — **done** |
| **F6** | **`sparkline`** / **`plotter`** publish; **`dashboardGroupId`** nest for published widgets — **done** |
| **F7** | **`dashboard-tab`** multi-page + tab bar; layout JSON **Export**; **`dashboardTabId`** publish target — **done** |
| **F8** | Layout JSON **Import** + local **Save** library; plotter follow-wire colors on Dashboard — **done** |
| **F9** | **`dashboard-switch`** / **`dashboard-slider`**; edit-mode grid placement + **Stack** — **done** |
| **F10** | Grid resize handles; **`dashboard-status`** + publish compare/indicator/threshold; **`dashboard-controls-demo`** — **done** |
| **F11** | Dashboard Inspector (Overview / Widgets / Controls / Layout); 8-handle resize; edit UX; widget corner radius; plotter in Controls; tab switcher; overlap warnings in inspector; **Esc** deselect — **done** |

## Backlog (post-F11)

| Item | Notes |
| ---- | ----- |
| Flow-preset parity for dashboard layouts | Deferred — use Export/Import + local library for now |
| More HMI kinds | dropdown, image tile, formatted template text |
| Dashboard keyboard | Arrow keys nudge placement (Edit mode) |

## Layout import / library (F8)

- **Export** / **Import** toolbar buttons — JSON is the same `DashboardLayoutExportV1` envelope as export (`version: 1`, `snapshot`).
- **Import** applies `placement`, `flex`, `publishToDashboard`, `dashboardGroupId`, `dashboardTabId`, tab `order`, and **Dashboard Output** `layout` to flow nodes matched by **`sourceNodeId`** (single undo step via `importDashboardLayoutJson`).
- **Save** stores the current committed snapshot in browser **`localStorage`** (`dashboard-layout-library.ts`); **Apply** reloads a saved entry.
- Missing node ids are skipped; toolbar feedback reports matched vs missing counts.

## Plotter colors on Dashboard (F8)

Published **`plotter`** widgets use **`resolvePlotterChannelColors`** (same as the flow canvas) so trace colors follow upstream wire semantics when `colorMode` is not `custom`.

## Related

- `STAGE_VIEWPORT_AND_SCENE_OUTPUT.md` — 3D commit pattern
- `FLOW_DOMAINS.md` — Domain F tick subscription
