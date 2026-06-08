# Model Outliner

Blender-style **Scene Outliner** workbench pane for Sensor Studio. Browse a scoped GLB, inspect extractable items (animations, parts, materials, morphs, lights, cameras), and drag or spawn linked flow nodes onto the canvas.

Replaces the Library **Model** (GLB) tab — model extraction lives in this dedicated pane.

## Product decisions (2026-06-06)

| Topic | Decision |
| --- | --- |
| **Pane placement** | Default **left column under Library** (above Asset Browser). User can reorder via workbench tiling / presets. |
| **Tree loading** | Wait for **full GLB introspection** before showing the tree (no partial lists). |
| **Tree layout** | User preference: **Type folders** (Animations / Parts / …) or **Scene hierarchy** (object graph). Persisted in `localStorage`. |
| **Model scope** | User preference: **Canvas Model Source** (pick a `model-select` flow node) or **Catalog model** (pick a catalog GLB without requiring a Model Source on the graph). Persisted in `localStorage`. |
| **Library GLB tab** | **Removed** — Outliner is the single model-extraction surface. |

## Workbench integration

| Item | Value |
| --- | --- |
| Editor type | `model-outliner` |
| Registry | `studio-workbench-registry.tsx` → `WorkbenchModelOutlinerPanel` |
| Default layout | Left column: Library → **Model Outliner** → Assets |
| Pane command | “Open Model Outliner” |

## Scope modes

### Canvas Model Source (`canvas-model-select`)

- Dropdown lists all `model-select` nodes on the flow graph.
- Fetch URL resolved from the node’s `selectedStudioAssetId` / `selectedModelUrl` (same as Library GLB tab).
- Spawn / drag parent = selected Model Source node.

### Catalog model (`catalog-inline`)

- Dropdown lists catalog GLB assets (`listStudioModelDescriptors`).
- Loads the model **without** a Model Source on the canvas.
- Spawn / drag resolves a parent `model-select` by:
  1. Matching `selectedStudioAssetId` on an existing Model Source, else
  2. Sole Model Source on canvas (if exactly one), else
  3. **Add Model Source** action — spawns `model-select` and applies the catalog pick.

## Tree modes

### Type folders (`folders`)

Reuses `GlbExtractionTabPanel` sections: Animations, Parts, Materials, Morphs, Lights, Cameras. Search filters across all sections. Drag MIME: `application/x-ternion-sensor-studio-glb-extract+json`.

### Scene hierarchy (`hierarchy`)

Full object graph from `StudioGltfExtractionResult.sceneTree` (built during the same GLB load as folder extraction). Named nodes and structural groups are shown; extractable rows (parts, lights, cameras) expose drag/spawn when they map to an extraction row.

**Animations, materials, and morphs are not Object3D nodes** — they are GLB metadata. In hierarchy mode those filters (and the Animations block when **All** is selected) use the flat extract list instead of the object tree.

## Phase plan

### Phase 1 (complete)

- [x] Register `model-outliner` pane + default layout under Library
- [x] Scope mode + tree mode preferences (persisted)
- [x] Catalog-inline and canvas Model Source pickers
- [x] Full-load GLB extraction; folders + hierarchy tree
- [x] Search, placed badges, drag/double-click spawn (existing GLB handlers)
- [x] Remove Library **Model** tab
- [x] Focus Model Source on canvas (select flow node from outliner)
- [x] Type filter chips (animations only, parts only, …)
- [x] Canvas Model Source selection syncs outliner scope when a `model-select` node is selected on Flow

### Phase 3b — UI polish (2026-06-06)

- [x] Flat hierarchy rows with type icons (no per-row bordered cards)
- [x] Hide redundant **PART** / kind badges when a type filter chip is active
- [x] Resizable tree / **Properties** split (ratio persisted in `localStorage`)
- [x] Blender-style **Transform** grid (Loc / Rot / Scl × X Y Z) in collapsible inspector sections
- [x] Compact status row: **Stage sync** + spawn parent + **Focus** on one line
- [x] Search match highlight on row labels
- [x] Hover **+** quick-spawn on hierarchy and flat extract rows
- [x] Collapsible **Animations** block (hierarchy + **All**); expanded state persisted
- [x] **Properties** empty state — model label + extract counts grid

### Phase 3d — Navigation + compact chrome (2026-06-06)

- [x] **Canvas / Catalog** and **Folders / Hierarchy** as compact segmented controls (one row)
- [x] Scene hierarchy keyboard nav — focus tree, **↑ ↓** move selection, **← →** expand/collapse, **Enter** confirms
- [x] Search auto-expands matching branches while filtering

### Phase 3e — List nav + hierarchy bulk expand (2026-06-06)

- [x] Flat extract lists (Folders mode + hierarchy type filters) — focus list, **↑ ↓** move, **Enter** select — **`model-outliner-extract-list-nav.ts`**, **`GlbExtractionTabPanel`**
- [x] Hierarchy toolbar **Expand all** / **Collapse all** — **`collectAllExpandablePaths`**

### Phase 2 (shipped incrementally)

- [x] Stage viewport pick → outliner selection (`useStageSceneStore.lastViewportPick`, **Stage sync** toggle)
- [x] Per-object detail strip (kind, ref, duration, Stage hit path/point, spawn action)
- [x] Transform + material slot breakdown in detail strip (`objectDetailsByPath`, `materialDetailsByName` from GLB introspection)
- [x] Inline spawn without Model Source (catalog binding on spawned nodes; drag payload v2)
- [x] Select-on-click / double-click spawn in Outliner lists
- [x] Cross-links from node inspectors / Model Source card → Outliner (`ModelOutlinerOpenLink`, `model-outliner-navigation.ts`)
- [x] Stale Library **Model** tab copy removed from `GlbExtractionTabPanel` and Part Spin hints

## Navigation

`ModelOutlinerOpenLink` + `openModelOutliner()` focus the workbench pane and apply scope / type-filter / selection via `useModelOutlinerNavigationStore`. Inspector clip/part dropdowns remain for binding; full browse + spawn lives in Outliner only.

## Related code

| Area | Path |
| --- | --- |
| Panel | `features/editor/model-outliner/ModelOutlinerPanel.tsx` |
| Scope helpers | `features/editor/model-outliner/model-outliner-scope.ts` |
| UI persistence | `features/editor/model-outliner/model-outliner-ui-persistence.ts` |
| Type filter | `features/editor/model-outliner/model-outliner-type-filter.ts` |
| Detail resolver | `features/editor/model-outliner/model-outliner-object-detail.ts` |
| Detail strip UI | `features/editor/model-outliner/ModelOutlinerDetailStrip.tsx` |
| Open link + nav | `features/editor/model-outliner/ModelOutlinerOpenLink.tsx`, `model-outliner-navigation.ts` |
| GLB extraction | `features/editor/gltf/studio-gltf-extract.ts` |
| Drag payload | `features/editor/components/node-palette/glb-extract-drag.ts` |
| Spawn handlers | `app/SensorStudioMain.tsx` |
| GLB animation plan | `docs/GLB_ANIMATION_FLOW_IMPLEMENTATION_PLAN.md` |
