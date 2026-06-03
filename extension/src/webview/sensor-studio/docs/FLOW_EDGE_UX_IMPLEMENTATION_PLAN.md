# Flow edge UX — implementation plan

Canonical plan for **wire appearance**, **connection chrome**, and **Canvas inspector** controls when no flow node is selected. Complements **`NODE_ANIMATOR_PARITY.md`** (Phases 4–6: colored connect line, reroute, bridge on delete) and **`persistence/flow-canvas-preferences.ts`** (canvas prefs v0.3).

**Status:** **Phase A–D shipped** (**2026-06-02**) — prefs, decoration, parallel/bundle/bus-lane offsets, reconnect, edge menu/toolbar, interaction width. Remaining: true step **overlap bridges** (custom edge), minimap edges (RF API).

---

## Goals

1. Make dense graphs **easier to read** (selection, crossings, direction, calm motion).
2. Expose **every wire-related knob** in the UI — no “hidden React Flow defaults only.”
3. Persist choices in **localStorage** and **flow document** (`canvasPreferences`) so dev and VSIX match.
4. Keep **port-type colors** as the primary semantic channel (do not replace with a single accent color).

---

## Current state (shipped)

| Capability | Where |
| ---------- | ----- |
| Port-type stroke color | `edges/flow-port-edge-colors.ts`, `edge.label` = port type |
| Four path styles | `edgeRoutingStyle` → `decorateFlowEdges()` |
| Animated dash on all edges | `defaultEdgeOptions.animated: true`, store `onConnect` |
| Colored connection line while dragging | `FlowCanvas` `connectionLineStyle` |
| Wide hit path | React Flow `react-flow__edge-interaction` (~20px) |
| Shift+click → reroute | `handleEdgeClick` → `insertRerouteOnEdge` |
| Selected wire toolbar | `EdgeSelectionToolbar` → junction / highlight / delete |
| Inspector (partial) | **Canvas inspector → View** tab → **Wires & grid** card: routing + grid only |

**Not used yet:** `edgeTypes`, `markerEnd` / `markerStart`, `elevateEdgesOnSelect`, `pathOptions` (borderRadius, offset), visible edge labels, edge reconnect, custom edge component, per-edge animation override.

---

## Inspector UX — new **Wires** tab

Today **`CanvasInspectorPanel`** tabs: **View** | **Flow** | **Sensors** (`canvas-inspector-ui-persistence.ts`).

### Proposed tab bar

| Tab | Icon (Lucide) | Scope |
| --- | ------------- | ----- |
| **View** | `LayoutGrid` | Viewport, background, grid, snap, minimap, interaction mode (pan vs select) |
| **Wires** | `Cable` or `GitBranch` | All edge + connection + handle chrome (this plan) |
| **Flow** | `FileStack` | Document summary, templates, import/export (unchanged) |
| **Sensors** | `Activity` | Telemetry (unchanged) |

### Migration from View tab

- Split **`wires-grid`** card on **View** into:
  - **View → Grid & snap** — `showGrid`, `gridSize`, `snapToGrid`, minimap toggles.
  - **Wires tab** — everything in [Configurable parameters](#configurable-parameters) below.
- Persist tab id: extend `CanvasInspectorTab` with `"wires"`; migrate stored `"canvas"` users unchanged.
- Card order / collapse: mirror **`CanvasInspectorCanvasTab`** — draggable collapsible **`CanvasInspectorCard`** sections on **Wires** tab.

### TRN patterns

- **`InspectorSegmentButtonGroup`** — enums (routing, stroke width preset).
- **`InspectorCompactToggleRow`** — booleans (animate, markers, elevate on select).
- **`InspectorNumericScrubRow`** or **`TRNScrubNumberInput`** — numeric ranges (opacity, border radius, connection radius).
- **`TRNTooltip` / `TRNHintText`** — no native `title` on controls.

---

## Configurable parameters

All fields live on **`FlowCanvasPreferences`** (extend + bump coerce version in **`flow-canvas-preferences.ts`**). Defaults must match today’s look (bezier, 2px, animated on) unless noted.

### Path & shape

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `edgeRoutingStyle` | `bezier` \| `smoothstep` \| `step` \| `straight` | `bezier` | Segment group (exists) | `decorateFlowEdges` → RF `type` |
| `smoothStepBorderRadius` | number (px) | `8` | Scrub 0–24 | `pathOptions` on smooth/step edges |
| `smoothStepOffset` | number (px) | `0` | Scrub 0–32 | Parallel edge offset (pair with bundling later) |

### Stroke & motion

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `edgeStrokeWidth` | `1.5` \| `2` \| `2.5` | `2` | Segment group | `edge.style.strokeWidth`, `defaultEdgeOptions` |
| `edgeAnimated` | boolean | `true` *(match today)* | Toggle “Flowing wires” | `edge.animated`, `defaultEdgeOptions.animated` |
| `edgeIdleOpacity` | number 0.25–1 | `1` | Scrub or slider | CSS / style on non-selected edges |
| `edgeSelectedStrokeWidth` | number | `+0.5` vs base | Scrub optional | Selected edge class |
| `edgeSelectedGlow` | boolean | `true` | Toggle | CSS filter / dual stroke in custom edge (Phase B) |

### Selection & hover

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `elevateEdgesOnSelect` | boolean | `true` | Toggle | `ReactFlow` prop |
| `edgeHoverHighlight` | boolean | `true` | Toggle | `.react-flow__edge:hover` CSS |
| `dimUnrelatedEdgesOnSelection` | boolean | `false` | Toggle | Opacity on edges not incident to selection |

### Direction & labels

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `edgeShowMarkers` | boolean | `false` | Toggle | `markerEnd` SVG in `decorateFlowEdges` |
| `edgeMarkerSize` | `small` \| `medium` | `small` | Segment | Marker path scale |
| `edgeMarkerHideBelowZoom` | number | `0.55` | Scrub 0.3–1 | Hide markers when `viewport.zoom` below |
| `edgeShowTypeLabel` | `never` \| `hover` \| `always` | `never` | Segment | `EdgeLabelRenderer` (Phase B) |

### Connection drag (preview wire)

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `connectionLineStrokeWidth` | number | `2` | Scrub 1–4 | `connectionLineStyle` |
| `connectionRadius` | number (px) | RF default | Scrub 8–40 | `ReactFlow` `connectionRadius` |

### Hit testing

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `edgeInteractionWidth` | number (px) | `20` | Scrub 8–32 | Custom edge or RF interaction path |

### Live graph semantics (Phase B+)

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `liveEdgeHighlight` | boolean | `false` | Toggle | Pulse / brighter stroke when upstream sensor `health === live` |
| `staleEdgeDash` | boolean | `false` | Toggle | Dashed stroke when upstream `stale` / `offline` |

### Minimap

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `minimapEdgeTintByPortType` | boolean | `false` | Toggle | Minimap edge stroke = port color |

### Handles (socket chrome on nodes)

| Field | Type | Default | UI control | Applied in |
| ----- | ---- | ------- | ---------- | ---------- |
| `handleSizePx` | `10` \| `12` \| `14` | `12` | Segment | `StudioNodeCard` `handleBaseClass` / layout nodes |
| `handleBorderWidthPx` | `1` \| `2` | `2` | Segment | Handle `style` / Tailwind |
| `handleDimWhenUnwired` | boolean | `false` | Toggle | Opacity on unwired handles (Policy A aware) |

Port-type **border colors** stay derived from theme (`flowNodeHandleStyle`) — not duplicated per user hex (keeps theme sync).

### Grid (stay on **View** tab)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `showGrid`, `snapToGrid`, `gridSize`, `showMinimap`, `backgroundHex`, `interactionMode`, `autoFitViewOnReplace` | existing | No move to Wires tab |

---

## Implementation phases

### Phase A — Quick visual wins (1–2 sessions) — shipped **2026-06-02**

- [x] Extend **`FlowCanvasPreferences`** + **`coerceFlowCanvasPreferences`** (new fields with safe defaults).
- [x] Wire prefs in **`decorateFlowEdges`**, **`FlowCanvas`** (`elevateEdgesOnSelect`, `connectionRadius`, `defaultEdgeOptions`).
- [x] CSS: **`flow-canvas-edges.css`** — selected / hover / dim-unrelated.
- [x] **`edgeAnimated`** toggle (default **on** to preserve current behavior).
- [x] **`edgeStrokeWidth`**, **`edgeIdleOpacity`**, **`elevateEdgesOnSelect`**, hover + dim-unrelated toggles.
- [x] **`smoothStepBorderRadius`** via `pathOptions` when routing is smoothstep/step.
- [x] New inspector tab **`CanvasInspectorWiresTab`**; **View** tab **Grid & snap** only.
- [x] Persist via existing **`canvasPreferences`** + localStorage coerce (no schema bump required).
- [x] Unit tests: coerce defaults, `decorateFlowEdges` width/animation/pathOptions/dim.

### Phase B — Direction, labels, live state (1–2 sessions) — shipped **2026-06-02**

- [x] **`edgeShowMarkers`** + zoom gate; port-colored **`markerEnd`** (`flow-edge-markers.ts`).
- [ ] Optional **`FlowStudioEdge`** custom `edgeTypes` wrapper (glow + core stroke) — deferred; live glow uses stroke filter + CSS class.
- [x] **`edgeShowTypeLabel`** never / hover / always on decorated edges.
- [x] **`liveEdgeHighlight`** / **`staleEdgeDash`** from source node **`sensorHealth`** (`flow-edge-source-health.ts`).
- [ ] **`minimapEdgeTintByPortType`** — deferred (MiniMap renders nodes only in `@xyflow/react` v12).
- [x] Handle size / border / dim-unwired via **`FlowCanvasPreferencesProvider`** + **`flow-node-handle-chrome.ts`**.

### Phase C — Dense graph readability (partial)

- [x] Parallel edge **`pathOptions.offset`** per index between same node pair (`edgeParallelSpacing`, `flow-edge-parallel-offset.ts`).
- [x] Edge bundling / trunk routing — **`edgeBundleMode`** (fan out / fan in / both) + **`edgeBundleSpacing`** (`flow-edge-bundle-offset.ts`).
- [x] Post-layout edge bus lanes — **`edgeBusLaneSpacing`** + target sort axis (`flow-edge-bus-lane-offset.ts`; use after auto-layout).
- [x] Step lane hop (partial) — **`edgeStepLaneHop`** extra corner radius on offset step/smooth wires (not true overlap SVG bridges).
- [x] **`edgeInteractionWidth`** on decorated edges (easier pick / context menu).

### Phase D — Interaction (partial)

- [x] Edge reconnect (`onReconnect`, `reconnectWithPolicy`, `edgesReconnectable` on **`FlowCanvas`**).
- [x] Edge context menu: insert reroute, delete, highlight downstream path (`FlowEdgeContextMenu`, right-click wire).
- [x] Toolbar action: add junction on selected edge (`EdgeSelectionToolbar`).
- [x] Stronger snap-to-handle magnet — default **`connectionRadius`** 28, range 8–56 px (Wires → Connecting).

---

## File touch list (Phase A–B)

| Area | Files |
| ---- | ----- |
| Types / persist | `persistence/flow-canvas-preferences.ts`, `components/flow-canvas-ui-persistence.ts` |
| Apply prefs | `edges/flow-port-edge-colors.ts`, `edges/decorate-flow-edges.ts` *(optional split)*, `components/FlowCanvas.tsx` |
| CSS | `flow-canvas-edges.css` (new), import in `FlowCanvas.tsx` |
| Inspector | `CanvasInspectorPanel.tsx`, `CanvasInspectorWiresTab.tsx` (new), `CanvasInspectorCanvasTab.tsx`, `canvas-inspector-ui-persistence.ts`, `canvas-inspector-helpers.ts` |
| Handles | `nodes/StudioNodeCard.tsx`, `layout-nodes/layout-flow-nodes.css` |
| Tests | `extension/tests/sensor-studio/flow-canvas-preferences.test.ts`, `flow-port-edge-colors.test.ts` |
| Docs | This file, **`DEVELOPMENT_TRACKER.md`**, **`NODE_ANIMATOR_PARITY.md`** § edge UX pointer |

---

## Acceptance criteria

1. With empty canvas selection, user opens **Wires** tab and changes routing, width, and animation — all wires update live.
2. Save flow JSON → reload → **`canvasPreferences`** restores wire settings.
3. New connection inherits current prefs (stroke width, animation, routing, markers).
4. Selected edge is visibly above nodes and thicker/brighter than idle wires when glow enabled.
5. No regression: port-type colors, Shift+click reroute, smart connect, socket policy.

---

## Related docs

- **`SOCKET_CONNECTION_POLICY.md`** — logic, not paint
- **`SMART_CONNECT.md`** — add-node on pane drop
- **`SENSOR_STUDIO_NODE_UI_RULES.md`** — handle stacking (`z-index: 20`)
- **`NODE_ANIMATOR_PARITY.md`** — shipped connect/reroute phases
