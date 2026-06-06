# Stage viewport and Scene Output (node-animator parity)

**Status:** B0–B1 shipped (2026-06-02) — workbench **Stage** pane + **Scene Output** catalog node + snapshot evaluator.

**Reference:** `D:/CODE/2026/node-animator` — **Brain** (`nodes` / FlowEditor) + **Stage** (`viewport` / StageViewport); graph commits via **Scene Output** (`sceneOutput`).

## Roles

| Surface | Purpose |
| -------- | -------- |
| **Model Viewer** (flow node) | Authoring preview inside the graph — resize with the node, Domain B subscriber |
| **Scene Output** (flow node) | Commit point — wires define what the **Stage** pane renders |
| **Stage** (workbench pane) | Full-bleed runtime 3D viewport (`StudioSceneViewport` with `presentation="stage-fullbleed"` — canvas on the pane root, no flow-card `ReadingPanel`) |

## Independence from Model Viewer and other flow nodes

The workbench **Stage** canvas is **not** the Model Viewer preview and does **not** share its `scene3d` blob or orbit/grid UI state.

| Concern | Stage (main scene) | Model Viewer / rotation nodes |
| -------- | ------------------ | ----------------------------- |
| Data source | `useStageSceneStore` ← `evaluateStageSceneSnapshot()` reads **only** `scene-output` `defaultConfig` + wires into that node | Each node's own `defaultConfig.scene3d` + **In** / FX wires |
| Defaults | `stageSceneOutputDefaultScene3d()` (grid off, Park cubemap) | `studioScene3dCatalogDefaults()` / `defaultScene3DConfig()` (grid on) |
| WebGL instance | `StageViewport` → `previewScopeId="sensor-studio-stage"` | `previewScopeId="flow-node:<reactFlowId>"` |
| GLB material/anim drives from graph | **Not** collected (`nodes: []` in Stage animation build — avoids single-`model-select` fallback) | Full graph scope for the wired model |
| Flow card preview | **Scene Output** — header icon only; commit hint in node Inspector — no embedded canvas | Embedded `StudioSceneViewport` on the node |

Changing Model Viewer grid, environment, or camera does **not** update Stage unless the same values are wired into **Scene Output** (or edited on Scene Output's saved `scene3d`).

## Workbench

- Registry editor type: **`stage`** — label **Stage**, icon MonitorPlay
- Default layout: **Stage** over **Flow** in the center column (Library/Assets | Stage+Flow | Inspector)
- Layout preset: **Stage focus** (wide Stage, thin flow strip)
- Command palette: **Open Stage**

Persistence key unchanged: `ternion_workbench_sensor-studio` (validates unknown panes → default layout).

## Scene Output node

Catalog id: **`scene-output`** (category **output**).

| Socket | Type | Role |
| ------ | ---- | ---- |
| **Models** | `string` | One or more wires from **Studio Model** (or string URL sources) |
| **Environment** | `environment` | Optional global env wire |
| **Camera** | `camera` | Optional camera wire |
| **Animation** | `glbAnimation` | Optional animation bundle wire |
| **Transform** | `transform` | Optional root transform wire |
| **Physics** | `physicsScene` | Optional **physics-world** wire (Rapier ground preview on Stage) |

**Defaults** (`core/stage/stage-scene-defaults.ts`): floor **grid off**; **Park** cubemap (`env.cubemap.park` / `textures/cubemap/park/`). New Scene Output nodes bake Park into `scene3d.environment`; the Stage demo wires an **Environment** node with the same preset.

## Evaluation (Domain B)

After each `tickSimulation()`:

1. `evaluateStageSceneSnapshot({ nodes, edges })` in `core/stage/evaluate-stage-scene-snapshot.ts`
2. Result stored in `useStageSceneStore` → **StageViewport** reads snapshot

When multiple **Models** wires are present, the Stage loads **all** GLBs side-by-side (`stageModelInstances` → `studio-viewport-stage-multi-models.ts`). The toolbar picker sets **focus** (`useStageSceneStore.primaryModelIndex`) for **Frame model**, GLB animation drives, and embedded-camera blending. Orbit **Reset camera** restores Scene Output `scene3d` rig (`studio-viewport-camera.ts`).

## Demo template

Canvas inspector → **Starter template** → **Stage + Scene Output** → **Run template**.

Spawns **Studio Model** (PSoC E84), **Environment (Park)**, and **Scene Output** (grid off) with wires (`Models` + `Environment`). Select **Scene Output** and open the **Stage** pane to preview.

- **First visit** with an empty saved graph: demo loads automatically on boot.
- **Stage empty state:** **Load Stage demo** button (same template).
- **Inspector default template:** **Stage + Scene Output** (dropdown still lists all presets).

Template id: **`stage-scene-output`** (`runDemoTemplate` in `flow-editor.store.ts`).

## Inspector

Select **Scene Output** on the flow canvas — **Node** tab includes **Scene Output** settings (floor grid, committed environment summary). The Stage toolbar shows model picker (when multiple models), cubemap name, frame/reset camera, and grid toggle.

## 3D Scene presentation override (default)

The workbench **3D Scene** (Stage toolbar) is an operator-facing editor for the committed scene. When **Environment → Scene Output (`env`)** is wired, toolbar actions for **backdrop** and **IBL** also patch the wired **Environment** node `defaultConfig` (`showBackgroundTexture`, `useCubemapIbl`) so the flow card toggles stay aligned with Stage.

| Control | Patches |
| ------- | ------- |
| Grid | Scene Output `showGrid` + `scene3d` |
| Backdrop / IBL (toolbar) | Scene Output `scene3d.environment` + wired Environment node (when `env` wired) |
| Cubemap / HDRI (toolbar `TRNSelect`) | Same fields (`presetIndex`, `studioAssetId`) on Scene Output + wired Environment node |
| Studio model (toolbar icon `TRNSelect`) | Focused **Models** wire from **model-select** — patches `selectedStudioAssetId` + `selectedModelUrl` on that node |
| Fog | Scene Output `scene3d.fog` only |

### Model catalog picker (Stage inspector + flow)

- **Options:** `buildStudioModelCatalogSelectOptions` / `buildScene3dInspectorModelCatalogSelectOptions` in `studio-model-catalog-select-ui.tsx` — leading **source icon** + trailing badge (**Free pack**, **Included**, **On this device**, **From web**) per `AssetDescriptor.source`.
- **Snapshot sync:** `evaluateStageSceneSnapshot` copies **`studioAssetId`** from each wired **model-select** into `snapshot.models[]` and `scene3d.model` so `resolveStudioModelGltfFetchUrl` does not load a stale baked id while the URL points at another GLB.
- **Inspector pick:** `StageInspectorScene3dTab` → `patchStageSceneModelCatalogSelect` uses **focused** model index (`primaryModelIndex`), not only the first Models edge.
- **Reload UX:** `StudioSceneViewport` keeps the previous mesh until a new URL load finishes; **embedded rig policy** changes on the same URL re-clone from an in-memory pristine GLB template (no multi-second blank scene).

**Modulation wires** on the Environment node (boolean inputs for backdrop/IBL) still win over card defaults on each simulation tick — same “wire wins” rule as elsewhere.

**Future:** per-user or per-project option for override behavior (`stage-presentation-override.ts` — modes `override-wired-environment` | `scene-output-only` | `flow-only`). Default today: **`override-wired-environment`**.

Stage toolbar shows **`Env · {label}`** when `env` is wired; TRN hints note that backdrop/IBL update the Environment node.

**Inspector:** With the **Stage** workbench pane focused (click the 3D viewport), the inspector shows **3D Scene** (committed scene summary + toolbar override policy). With the **Flow** pane focused and no node selected, **View** tab holds flow canvas settings (`stage-presentation-preferences.ts`, localStorage).

## Phased backlog

| Phase | Scope |
| ----- | ----- |
| **B0** | Stage pane + default layout — **done** |
| **B1** | Scene Output node + snapshot eval + Stage render — **done** |
| **B2** | Multi-model instances, selection, orbit toolbar, appearance/grid settings — **done** (2026-06-02) |
| **B3** | Rapier physics scene wire (`physicsScene` → snapshot) — **done** (`@dimforge/rapier3d-compat`, ground + graph colliders) |
| **B4** | Stage picking → Domain C events — **done** (`on-stage-pick`, hit point + object path on `liveStagePickWire`) |

## Related

- `FLOW_DOMAINS.md` — Domain B frame loop
- `NODE_ANIMATOR_PARITY.md` — editor UX parity tracker
- `TIER_D_PHYSICS_FOUNDATION.md` — physics on Stage (deferred D2+)
