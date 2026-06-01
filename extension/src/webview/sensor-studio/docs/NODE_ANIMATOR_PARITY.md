# node-animator parity (Sensor Studio flow editor)

Reference project: `D:\CODE\2026\node-animator` (`apps/node-animator/`).

This document tracks editor UX and catalog parity — **not** a 1:1 port of all 54 node-animator node types. Bitstream Studio keeps **telemetry (Domain A)** nodes and grows **scene / events / material (B–D)** per [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md).

## Catalog comparison

| | node-animator | Sensor Studio |
|---|---------------|---------------|
| Addable catalog entries | 54 (52 root) | 85 |
| Palette categories | 14 (Blender GN–style) | 7 schema categories + sensor subgroups |
| React Flow node types | 74 | 5 (`studio` + 4 layout types) |

**Target:** keep 53+ telemetry/scene nodes; add **layout** nodes (reroute, frame, note) and scene parity incrementally — not full simulation/physics catalog unless Digital Twin phases require it.

## Phase 1 — Editor UX (shipped)

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| **Shift+A** add-node menu | `FlowEditor.tsx`, `ContextMenu.tsx` | `FlowAddNodeMenu.tsx`, `SensorStudioMain.tsx` |
| Search + category browse | Two-column `ContextMenu` | Same pattern, 7 categories |
| Spawn at pointer | `screenToFlowPosition` | `addNodeFromCatalogAt` / linked spawn |
| Right-click canvas | Pane menu → Add node | Opens add-node menu |
| Esc closes menu first | Yes | Yes |
| Delete selection | RF default | `deleteKeyCode` on React Flow |
| Focus guard | `graphKeyboard.ts` | `is-flow-keyboard-target.ts` |

### Key files

- `features/editor/components/FlowAddNodeMenu.tsx`
- `features/editor/components/FlowCanvas.tsx` — pointer tracking, menu host
- `features/editor/keyboard/is-flow-keyboard-target.ts`
- `features/editor/keyboard/resolve-add-node-menu-anchor.ts`
- `app/SensorStudioMain.tsx` — Shift+A, Esc priority

## Phase 2 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Central shortcut registry | `graphKeyboard.ts` | `flow-keyboard-shortcuts.ts`, `useFlowKeyboardShortcuts` |
| Recent nodes in add menu | localStorage | `sensor-studio:recent-nodes` |
| Palette layout switcher | Library layout | `nodePaletteLayout` from runtime defaults + Library |
| Display taxonomy | GN-style groups | `palette-display-meta.ts` — 9 groups in Shift+A |

### Key files

- `features/editor/keyboard/flow-keyboard-shortcuts.ts`
- `features/editor/keyboard/use-flow-keyboard-shortcuts.ts`
- `features/editor/palette/nodePaletteLayout.ts`
- `features/editor/palette/palette-display-meta.ts`

## Phase 3 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Reroute / split / frame / note | layout node components | `studio-reroute`, `studio-frame`, `studio-note`, `studio-split` |
| **R** spawn reroute | pointer spawn | `useFlowCanvasLayoutShortcuts` via `reactFlowRef` (not `useReactFlow` outside `<ReactFlow>`) |
| Layout add-menu section | context menu groups | Virtual **Layout** section in `FlowAddNodeMenu` |
| Wire passthrough | reroute simulation | Store connect + simulation passthrough for reroute / split |

### Key files

- `features/editor/layout/` — types, builders, port resolution, menu entries
- `features/editor/layout-nodes/` — React components + CSS
- `features/editor/keyboard/use-flow-canvas-layout-shortcuts.ts`
- `features/editor/components/inspector/LayoutNodeInspectorPanel.tsx`
- `features/editor/store/flow-editor.store.ts` — `addLayoutNodeAt`, `spawnRerouteAt`, connect rules
- `extension/tests/sensor-studio/layout-flow-nodes.test.ts`

## Phase 4 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Type-colored wire while connecting | `onConnectStart` + `connectionLineStyle` | `FlowCanvas` + `flow-port-edge-colors.ts` |
| Copy / paste selection | `flowClipboard.ts` | `clipboard/flow-clipboard.ts`, **Ctrl+C** / **Ctrl+V** |

### Key files

- `features/editor/edges/flow-port-edge-colors.ts` — shared edge + connection-line colors
- `features/editor/clipboard/flow-clipboard.ts` — JSON clipboard marker + remap on paste
- `features/editor/store/flow-editor.store.ts` — `copyFlowSelectionToClipboard`, `pasteFlowFromClipboard`
- `extension/tests/sensor-studio/flow-clipboard.test.ts`
- `extension/tests/sensor-studio/flow-port-edge-colors.test.ts`

## Phase 5 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Shift+click edge → reroute | `onEdgeClick` + `splitEdgeWithReroute` | `FlowCanvas`, `reroute-graph-ops.ts`, `insertRerouteOnEdge` |

### Key files

- `features/editor/layout/reroute-graph-ops.ts` — split wire + pointer edge hit helper
- `features/editor/store/flow-editor.store.ts` — `insertRerouteOnEdge`
- `extension/tests/sensor-studio/reroute-graph-ops.test.ts`

## Phase 6 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Reroute bridge on delete | `bridgeReroutesOnNodeRemove`, `applyRerouteBridgeOnEdgeRemoves` | `reroute-graph-ops.ts`, `onEdgesChange`, `deleteSelection` |

Deleting a fully wired reroute reconnects `upstream → downstream` instead of breaking the link (React Flow edge-remove batch + programmatic delete).

## Phase 7 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Frame parenting | `syncFrameChildren`, `attachNodeToFrame` | `frame-flow-nodes.ts`, `onNodeDragStop`, `parentId` + `extent: parent` |
| Frame delete dissolve | `dissolveFrames` | `dissolveStudioFrames` in `deleteSelection` |

Drag a **studio** node onto a **frame** and release — it becomes a child and moves with the frame. Deleting a frame keeps children on the canvas.

### Key files

- `features/editor/layout/frame-flow-nodes.ts`
- `features/editor/store/flow-editor.store.ts` — `applyFlowFrameDragStop`
- `features/editor/components/FlowCanvas.tsx` — render sort + drag stop
- `extension/tests/sensor-studio/frame-flow-nodes.test.ts`

## Phase 8 — Shipped

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Frame auto-fit toggle | Inspector switch | `FrameLayoutInspectorSection`, `data.autoFit` |
| Fit to contents | Toolbar / inspector button | `fitSelectedFramesToContents` |
| Dissolve frame | Inspector button | `dissolveSelectedFrames` |
| Padding sliders | Header / sides / gap | TRN range sliders in frame inspector |

### Key files

- `features/editor/components/inspector/FrameLayoutInspectorSection.tsx`
- `features/editor/store/flow-editor.store.ts` — `fitSelectedFramesToContents`, `dissolveSelectedFrames`

## Phase 9 — Shipped (slices 1–3)

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| Group selection | **Ctrl+G** | `createGroupFromSelection` |
| Ungroup selection | **Ctrl+Shift+G** | `ungroupSelection` / `ungroupNodeGroup` / `dissolveStudioNodeGroupInParent` |
| Node group shell | `nodeGroup` | `studio-node-group` + boundary nodes |
| Drill-in | **Tab** / double-click | `enterGroup`, breadcrumb, **Shift+Tab** exit |
| Subgraph clipboard | `subgraphs` in payload | `buildFlowClipboardPayload` + `attachSubgraphsForPastedNodeGroups` |
| Group Sockets inspector | `NodeGroupInspector` | `NodeGroupInspectorSection` (+ boundary selection when drilled in) |
| Linked / deep duplicate | `duplicateGroupLinked` / `duplicateGroupDeepCopy` | Inspector buttons + `duplicate-group-instance.ts` |
| Eval flatten | `flattenGraphForEvaluation` | `flattenFlowGraphForEvaluation` in `tickSimulation` |

Design: [`FLOW_SUBGRAPHS.md`](./FLOW_SUBGRAPHS.md).

### Key files

- `features/editor/subgraphs/` — types, create, rewire, flatten, interface sync, store sync
- `features/editor/layout-nodes/NodeGroupLayoutNode.tsx` (+ Group Input/Output)
- `features/editor/components/inspector/NodeGroupInspectorSection.tsx`
- `features/editor/components/FlowGraphBreadcrumb.tsx`
- `extension/tests/sensor-studio/studio-subgraph.test.ts`
- `extension/tests/sensor-studio/studio-group-interface-sync.test.ts`

## Phase 9+ — Shipped (slices 1–4)

- Group library save/load — `.trn-node-asset.json` export/import, project library (`nodeGroupLibrary`), Library **Groups** tab, canvas drag instantiate (**2026-05-31** slice 1)
- Remote official presets — online `libraries/node-graph/index.json` + asset fetch (**2026-05-31** slice 2)
- Linked preset UI — **Update from library** / **Break library link** (**2026-05-31** slice 3)
- Node-animator import — `nodeGroup` / `groupInput` / `float` normalization on parse (**2026-05-31** slice 3)

## Phase 9+ — Shipped (flow domains)

- Material domain rAF tick — `graphNeedsMaterialDomainEvalInGraph` in **`useSensorStudioFlowTickScheduler`** (**2026-05-31** slice 4)

## Phase 9+ — Shipped (catalog)

- **Math** node — 13 ops (node-animator parity), **`math-operations.ts`**, catalog + dataflow eval + card/inspector UI + NA import (**2026-05-31**)
- **Math v1.1** — unary ops hide **B** input via **`computeMathInputHandles`**; inspector **`selectedNode`** prop fix (**2026-05-31**)
- **Compare** + **Lerp** nodes — node-animator utility parity, dataflow eval, NA import (**2026-05-31**)
- **Switch** + **Combine XYZ** — boolean/number branch + vector3 combine; **ifElse** / **combineXYZ** / **separateXYZ** NA import (**2026-05-31**)
- **Logic Gate** — AND / OR / NOT / XOR; dynamic **B** pin hide for NOT (**2026-05-31**)
- **Multiplexer** + **Value Normalizer** — JSON path extract + clamped range map; NA import (**2026-05-31**)
- **Map Range v2** — five wired inputs + card clamp/range defaults + `mapRange` NA import (**2026-05-31**)

## Phase 9+ — Shipped (NA parity Tier A + B slice 1)

- **Clamp v2** — wired `value`/`min`/`max`, card panel, `clamp` NA import (**2026-05-31**)
- **Bool import** — `bool` → `boolean-constant` (**2026-05-31**)
- **Sim generators** — Sine wired params + `ramp-sim` / `step-sim` / `noise-sim` + NA import (**2026-05-31**)
- **Vector constant** — `vector-constant` + `vector` NA import (**2026-05-31**)
- **Tier B import (best-effort)** — `environment*`, `texture`, `camera`, `transform`, `animation*`, `visibility` (**2026-05-31**)

## Phase 9+ — Shipped (NA parity Tier C slice 1)

- **Scene Time** + **Frame Delta** — flow clock + multi-output eval + NA import (**2026-05-31**)
- **Debug** — numeric passthrough + NA import (**2026-05-31**)
- **Position / Rotation / Scale** — partial vec3 builders + NA import (**2026-05-31**)
- **Scene Settings** + **Fog** — scalar outputs + NA import (**2026-05-31**)

## Phase 9+ — Shipped (group library)

- Feed cache badges / offline sync UX — sessionStorage cache, Live / Cached / Offline badges, retry + refresh (**2026-05-31**)

## Phase 9+ — Planned (full NA parity roadmap)

**Baseline after Tier A–C slice 2 + scene wiring + compositor + camera/particles:** ~40 / 53 NA root types with import or eval parity; fog / exposure / studio light / morph / bloom / contact shadows / camera-switch / particles wired into Model Viewer preview.

### Tier A — Utility / sim quick wins

- [x] **Clamp** — wired `value` + `min` + `max`
- [x] **Bool** — `bool` → `boolean-constant` NA import
- [x] **Sine Wave** — wired amp/freq/phase/offset + `sineWaveSim` import
- [x] **Ramp / Step / Noise** — generator nodes + NA import
- [x] **Vector** — `vector-constant` + NA `vector` import

### Tier B — Scene / material import (partial analog exists)

- [x] **Environment** — `environment` / `environmentHdri` / `environmentCubemap` → `environment` (import; pin parity backlog)
- [x] **Texture** — `texture` → `glb-material-texture` (import)
- [x] **Camera** — `camera` → `camera-view` (import)
- [x] **Transform** — `transform` → `object-transform` (import)
- [x] **Animation** — `animationClip` / `animationPlayer` → `glb-animation-bundle` (import)
- [x] **Visibility** — `visibility` → `event-toggle-glb-part` (best-effort import)

### Tier C — New catalog nodes (no Studio analog yet)

- [x] **Input / debug:** `time`, `frameDelta`, `debug` (slice 1)
- [x] **Input / debug:** `dataSource`, `wsClient`, `wsClientOut` → **`sensor-input`** (Bitstream telemetry substitute; channel/url → `sourceKey`)
- [x] **Geometry split:** `position`, `rotation`, `scale` (slice 1)
- [x] **Geometry:** `morph` → **`morph-target`** (slice 2; scene apply backlog)
- [x] **Material / world:** `sceneSettings`, `fog` (slice 1)
- [x] **Material:** `uvTransform` → **`uv-transform`**, `materialVariant` → **`material-variant`**, `material` → **`glb-material-color`** import (slice 2)
- [x] **Light / camera:** `light` → **`scene-light`**, `cameraSwitch` → **`camera-switch`** (slice 2; rig routing in preview **2026-05-31**)
- [x] **Compositor / FX:** `postProcessing`, `contactShadows`, `emitter` → **`post-processing`**, **`contact-shadows`**, **`particle-emitter`** (slice 2; bloom + contact shadows + particles in preview **2026-05-31**)

### Tier D — Deferred (Digital Twin / physics epic)

- [ ] **Physics stack:** `physics`, `rigidBody`, `objectSpawner`, colliders, `joint` variants, `ik` — see **[`TIER_D_PHYSICS_FOUNDATION.md`](./TIER_D_PHYSICS_FOUNDATION.md)**

Track slices in **`extension/docs/DEVELOPMENT_TRACKER.md`** (*In progress* / *Recently completed*).

## Shortcuts (current)

| Shortcut | Action |
|----------|--------|
| **Shift+A** | Toggle add-node menu |
| **Esc** | Close add menu → clear selection |
| **Right-click** canvas | Open add-node menu |
| **Ctrl+A** | Select all |
| **Ctrl+D** | Duplicate |
| **Delete / Backspace** | Delete selection (canvas focused) |
| **R** | Spawn reroute at pointer |
| **Shift+click** edge | Insert reroute on wire |
| **Ctrl+C** | Copy selection (or full graph if none selected) |
| **Ctrl+V** | Paste from clipboard |
| **Ctrl+G** | Group selection into node group |
| **Ctrl+Shift+G** | Ungroup selected node group |
| **Tab** | Enter selected node group |
| **Shift+Tab** | Exit to parent graph |
| **Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y** | Undo / redo |

See node-animator `docs/architecture/10-editor-ux.md` for the full reference set.
