# 3D Scene Editor — production plan

Canonical workbench for **`scene-3d`** page blocks. Each block references a **`scene.v1`** document (`content/{documentId}.scene.v1.json`).

## Shipped (production baseline)

| Area | Capability |
|------|------------|
| **Documents** | `scene.v1` schema; pack export/import; dev **Save scene** API; session draft restore |
| **Viewport** | Orbit camera — **Alt+LMB** rotate · **Alt+Shift+LMB** pan · scroll zoom; translate / rotate / scale gizmos (G / R / S); click-select; **Shift+drag** box select; **Save view** / **Reset camera**; view snaps **1 / 3 / 7 / 9**; **5** toggles perspective / orthographic (numpad or number row) |
| **Objects** | **Shift+A** add menu (two-pane: Mesh · Presets · Catalog · Group); Mesh primitives: box, sphere, cylinder, cone, plane, torus, capsule, ring, icosahedron, torus knot |
| **Inspector** | TRN glass **CourseInspectorCard** stack — block, grid placement, scene document, camera, environment, viewport (gizmo size), outliner, per-node transform / rotation / material |
| **Materials** | Optional `material` on model nodes — **12 prebuilt presets** (standard + physical PBR), editable kind / color / emissive / metalness / roughness / clearcoat / transmission / wireframe; **HTTPS texture map URLs** (map, normal, roughness, metalness, emissive, ao); procedural body meshes + catalog GLB tint |
| **Templates** | Empty-pane presets (blank, BMI PCB, gimbal, triad, box) |
| **Undo** | Per-scene undo/redo stack (50 steps); ⋮ Scene menu + scene store |
| **Persistence** | Dev **Save scene** + VSIX **course-studio-save-scene**; Copy JSON / Download / Import via ⋮ Scene menu |
| **Validation** | Pack validate warns on unknown model ids, invalid texture URLs, orphan scenes |
| **Bindings** | Per-axis position / scale telemetry bindings; live canvas status chip when bound |
| **Multi-select** | Shift+click viewport / outliner; **Shift+drag empty viewport** box select; **gizmo transforms all selected** (move / rotate / scale via active object); Ctrl+D duplicate all; Delete removes selection |
| **Active vs selected** | Blender-style multi-select; viewport **box / silhouette** highlights; configurable colors in **Selection highlights** card; outliner sync |
| **Grouping / parent** | **Ctrl+G** group; **Ctrl+P** Set Parent To (Object / Keep Transform); **Alt+P** Clear Parent (Clear / Keep Transformation / Clear Parent Inverse); outliner DnD |
| **Catalog GLB** | Per-mesh material target (`materialName`); animation clip playback; texture map repeat |
| **Runtime** | `CourseDiagram3DLayer` via `sceneV1ToDiagramV1()`; live BMI270 bindings; link-health parity with diagrams |

## Viewport guardrails (R3F)

Course Studio 3D uses **react-three-fiber** inside `CourseScene3dViewport` → `CourseDiagram3DLayer`. When debugging a **black canvas** with a healthy dev HUD (frames incrementing, meshes/lights listed, `ctx lost: false`), check these rules before chasing layout or asset paths.

### `useFrame` priority — do not use positive values

R3F treats any `useFrame(callback, priority)` with **priority > 0** as a signal that the subscriber will **take over rendering**. In that mode R3F **stops calling `gl.render(scene, camera)` automatically**; your callback must render the frame itself. If it does not, the canvas stays permanently black while the scene graph and `useFrame` hooks still run (misleading debug HUD).

| Do | Avoid |
|----|-------|
| `useFrame(() => { … })` or `useFrame(() => { … }, 0)` for transform sync, probes, helpers | `useFrame(() => { … }, 1)` (or any positive priority) unless you explicitly call `gl.render` |
| Negative priority (e.g. `-2`) only when you need to run **before** auto-render (orbit `controls.update()`) | Positive priority “to run after something else” — use `0` and ordering inside the callback instead |

**Where it bit us (2026-06-10):** gizmo transform sync in `CourseDiagram3DLayer.tsx` (`Diagram3dModelNode` / `Diagram3dGroupNode`) used priority `1`. Fix: change to `0`; keep the inline guard comment when editing those hooks.

### Viewport shell parity

Match the working **`RotationPreviewViewport`** pattern when changing the canvas host:

- Inner host: `relative flex min-h-0 flex-1 overflow-hidden`
- Canvas: `className="h-full w-full"`
- `onCreated`: ACES tone mapping + sRGB output (`courseScene3dGl.ts` / `applyCourseScene3dRendererDefaults`)
- Wrap scene content in `<Suspense fallback={null}>`
- Stage grid: drei `<Grid>` (not raw `THREE.GridHelper` via `<primitive>` unless you have a specific reason)

Dev-only: green origin marker + debug HUD live in `CourseScene3dDevKit.tsx` (`import.meta.env.DEV`).

## Key paths

| Item | Path |
|------|------|
| Workbench pane | `workbench/panes/CourseScene3dWorkbenchPane.tsx` |
| R3F viewport shell | `runtime/scene/CourseScene3dViewport.tsx`, `runtime/scene/courseScene3dGl.ts` |
| Scene content + transform `useFrame` | `runtime/diagram/CourseDiagram3DLayer.tsx` |
| Viewport + gizmo | `maintainer/CourseSceneEditorViewport.tsx` |
| Object pill (add / duplicate / delete) | `maintainer/CourseSceneObjectRail.tsx` |
| Add menu (Shift+A) | `maintainer/CourseSceneAddMenu.tsx` + `maintainer/courseScene3dAddCatalog.ts` |
| View snap shortcuts | `runtime/diagram/diagram3dViewSnapShortcuts.ts` |
| Projection toggle (5) | `runtime/diagram/diagram3dProjectionToggle.ts` — spec **`extension/docs/VIEWPORT_PROJECTION_TOGGLE.md`** |
| Scene document menu (undo / save) | `maintainer/CourseSceneDocumentMenu.tsx` |
| Add presets | `maintainer/courseScene3dModelPresets.ts` |
| Material schema | `schemas/diagram.v1.ts` → `diagram3dMaterialSchema` |
| Material presets | `runtime/diagram/diagram3dMaterialPresets.ts` |
| Material resolve | `runtime/diagram/diagram3dMaterial.ts` |
| Material renderer | `runtime/diagram/Diagram3dMeshMaterial.tsx` |
| Texture map URLs | `runtime/diagram/diagram3dTextureMaps.ts`, `diagram3dTextureLoader.ts`, `useDiagram3dMaterialTextureMaps.tsx` |
| Outliner + hierarchy | `maintainer/CourseSceneOutliner.tsx`, `CourseSceneParentMenu.tsx`, `CourseSceneClearParentMenu.tsx`, `runtime/scene/scene3dHierarchyOps.ts` |
| Viewport prefs (gizmo + selection) | `maintainer/Diagram3dViewportFields.tsx` + `useCourseDiagram3dViewportPrefs.ts` + `runtime/diagram/diagram3dSelectionAppearance.ts` |
| Node inspector cards | `maintainer/CourseDiagram3dNodeInspector.tsx`, `Diagram3dTransformFields.tsx`, `Diagram3dRotationFields.tsx`, `Diagram3dMaterialFields.tsx`, `Diagram3dPropertyBindingsFields.tsx`, `Diagram3dAnimationFields.tsx` |
| Contextual inspector stack | `workbench/panes/CourseScene3dInspectorPanel.tsx` — Caption → Grid placement → Scene document → Outliner → 3D model → Camera → Environment → Viewport |
| Page block inspector fields | `maintainer/CourseScene3dBlockFields.tsx` (`CourseScene3dPageBlockFields`) |
| Inspector chrome | `maintainer/CourseInspectorCard.tsx` |

## Maintainer workflow

1. Select a **`scene-3d`** block on the Content grid.
2. **3D Scene Editor** pane opens the bound scene viewport.
3. **Shift+A** (or **+** pill / right-click) → **Add object** menu → Mesh / Presets / Catalog / Group.
4. Click object → gizmo + **Inspector** cards (**3D model**, **Transform**, **Rotation**, **Material** when applicable).
5. **Scene document** / **Default camera** / **Environment** / **Viewport** cards in the inspector stack (collapsible glass cards).
6. **⋮ Scene** menu → **Save scene** (dev / VSIX), **Copy JSON**, **Download**, or **Import**; session draft survives browser refresh.

## Planned / next (post-baseline)

| Priority | Item | Status |
|----------|------|--------|
| P1 | VSIX smoke — scene round-trip in packaged extension | **done** — see **`extension/HOW_TO_RUN.md`** § F |
| P2 | Scene **bindings panel** (live canvas parity with diagram Konva) | **done** |
| P3 | Per-mesh material slots on catalog GLBs (`materialTarget` / `materialName`) | **done** |
| P4 | Texture maps (albedo / normal / roughness) + **map repeat** | **done** |
| P5 | Animation clip playback nodes (catalog GLB) | **done** |
| P6 | Multi-select + group transform in viewport | **done** |
| P7 | Mesh tier-1 + tier-2 primitives | **done** |

## Testing

```bash
cd extension
npm run test:course-studio
```

Coverage: `diagram3dMaterial.test.ts`, `diagram3dTextureMaps.test.ts`, `sceneV1.test.ts`, `courseScene3dAddMenu.test.ts`, `sceneEnvironment.test.ts`, `courseSceneSelection.test.ts`, `sceneContentValidate.test.ts`, focus/selection helpers, pack validate.

## Related

- Architecture: `docs/ARCHITECTURE.md` § 3D scene documents
- Tracker: `extension/docs/DEVELOPMENT_TRACKER.md`
- Dual runtime (live bindings): `extension/docs/TELEMETRY_MODE_LIFECYCLE.md`
