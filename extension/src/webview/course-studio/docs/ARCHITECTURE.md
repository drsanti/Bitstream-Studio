# Course Studio — architecture

Course Studio is the **v2 alive-documents** workspace for Bitstream Studio. Presentation v1 (`../presentation/`) remains frozen as a slide-deck backup.

## Layout

```text
course-studio/
  CourseStudioWorkspace.tsx   # workspace entry
  layout/CourseStudioShell.tsx  # top bar + workbench host
  workbench/                    # StandaloneWorkbench registry + panes
  runtime/
    CoursePageRenderer.tsx    # 12-col grid
    BlockRenderer.tsx         # block kind → UI
  schemas/page.v1.ts          # zod page schema
  content/                    # pilot pages (`*.page.v1.json`), theory (`*.theory.md`)
  content/markdownRegistry.ts # bundle `?raw` md + maintainer drafts
  maintainer/                 # dev-only editor (gate: `import.meta.env.DEV`)
  motion/                     # GSAP data tweens + timeline stub
  shared/live.ts              # re-exports presentation live hooks
  ui/catalog/                 # callouts, cards, live metric
```

## Maintainer mode (dev only)

Toggle in the Course Studio top bar (persisted in `localStorage`). When enabled:

- Click blocks on the page to select
- Edit copy, markdown (inline or external `src` file), and grid placement in the right inspector
- **Save page** writes validated JSON via `POST /__dev_api/course-studio/save-page`
- **Save markdown** writes external theory files via `POST /__dev_api/course-studio/save-markdown`

Packaged VSIX: read-only — no maintainer toggle.

## Live data

**Do not fork decode.** Blocks that need telemetry import from `shared/live.ts`, which re-exports `usePresentationBmi270` (and siblings) from the presentation layer. Those hooks read `useBitstreamLiveStore` — same path as Sensor Telemetry and Presentation v1.

## Grid model

Page blocks use the same placement fields as Sensor Studio Dashboard: `column`, `row`, `columnSpan`, `rowSpan` (1-based). See `schemas/placement.ts`.

## Theme

`CourseStudioShell` wraps content in `PresentationThemeProvider` so Course Studio shares presentation CSS variables (`--surface-*`, `--accent-*`, KaTeX markdown styles).

## Workspace routing

| Surface | Id |
|---------|-----|
| Dev URL | `?workspace=course-studio` |
| Toolbar tab | **Course Studio** (amber) |
| Shortcut | Ctrl+Shift+4 |

## Diagrams (Phase 7b)

| Item | Path |
|------|------|
| Schema | `schemas/diagram.v1.ts` |
| Renderer | `runtime/diagram/CourseDiagramRenderer.tsx` |
| Binding eval | `runtime/diagram/evaluateDiagramScene.ts` |
| Pilot | `content/pilot-bmi-accel-mems.diagram.v1.json` |

Page blocks reference diagrams via `diagram-2d` + `diagramId`. Live proof-mass offset and `aX` label bind to `bmi270.ax` through the same presentation live store.

**Link health (7g slice):** Default policy `freeze-gray` — when WS/COM is down or no BMI270 sample, diagrams hold the last good values and render with inactive styling. Diagram cards show **Live bindings** vs **Frozen** badge.

**Maintainer undo:** Ctrl+Z / Cmd+Z (and Ctrl+Shift+Z / Ctrl+Y redo) when Maintainer is on — **page grid** drag/resize on the main canvas, plus **diagram** edits when the Diagram inspector tab is active. Typing in block text fields keeps native text undo.

**Diagram maintainer (7c):** Select a `diagram-2d` block → **Draw** tab (Konva live canvas + per-shape **Data bindings** panel) or **Data layer (SVG)** tab. **Any object property** — position, size, opacity, text, visibility, 3D rotation, connector flow/highlight — can bind to live sensor paths (`bmi270.*`) or bridge variables; MapOp scale/clamp chains map raw values to layout. Bound fields stay data-driven on page preview; static canvas edits define layout only.

**Konva freeform:** `diagram.v1` `freeform` engine `konva` with `propertyBindings` maps shape id → property → binding spec; `evaluateKonvaShapes` resolves live values at preview/runtime. Legacy `excalidraw` freeform payloads migrate to Konva on parse.

**3D scene documents (7f slice):** Page block `scene-3d` references `content/{documentId}.scene.v1.json` (`scene.v1` — nodes, camera, environment settings, link health). Runtime: `CourseDiagram3DLayer` via `sceneV1ToDiagramV1()`. Maintainer **3D Scene Editor** workbench pane edits the bound scene document (gizmo viewport, add/duplicate/delete objects, per-model PBR `material`, environment, undo/redo, dev **Save scene**). Production checklist and backlog: **`docs/SCENE_3D_EDITOR.md`**. Legacy `diagram-3d` + `sceneId` blocks migrate to `scene-3d` on page parse. Pilot: `pilot-bmi-pcb-orientation`.

**3D layers (7f):** `diagram.v1` optional `layers[]` — `{ kind: "2d", nodes }` and `{ kind: "3d", nodes }`. Runtime: `CourseDiagramCompositeRenderer` (page preview). Layered `diagram-2d` blocks with a 3D layer route to **Diagram** pane **3D layer** sub-tab (`CourseDiagram3dViewportEditor`); page-level **`scene-3d`** blocks route to **3D Scene Editor** instead.

**Document meta (7g):** Optional `page.meta` — `telemetryPreference` (`auto` | `uart` | `simulator`), `defaultLinkHealth`, `staleMs`. When `staleMs` is set, link health compares `bs2EvtSensorLastRxAtMs` (or firmware RX fallback) against wall clock — stale samples trigger **Stale** badges and diagram `freeze-gray` inactive styling. Shell shows route + data chips via `CourseDocumentStatusBadge`.

**Markdown admonitions (7i slice):** Blockquotes `> **Note:**`, `**Warning:**`, `**Tip:**`, `**Danger:**` render as `PresentationCallout` (same tokens as grid callout blocks) in `PresentationTheoryMarkdown` and Course Studio markdown blocks.

## Maintainer inspector panel

Maintainer mode uses a **split-pane workbench** (`workbench/CourseWorkbenchLayout.tsx`) with dedicated panes for Content, Inspector, Diagram, Markdown, and 3D Scene. The **Inspector side panel** is **contextual** — it follows the active editor pane (`useCourseWorkbenchFocusStore.contextEditorType`): Page/Block when Content is focused, Diagram bindings/nodes when Diagram is focused, Markdown block fields when Markdown is focused, 3D models when 3D Scene is focused.

Legacy `CourseMaintainerSidePanel` (`TRNSidePanel`) is superseded by the workbench but kept for reference.

## Grid composer (Phase 7h slice)

Maintainer mode uses `CoursePageGridComposer` — reuses Sensor Studio dashboard grid math:

- **Drag** handle repositions `column` / `row`
- **Resize** handles (`e`, `s`, `se`) adjust span
- **Block palette** adds new blocks at first open grid slot
- Inspector **Delete** removes a block (page keeps ≥1 block)

## Next phases

**3D Scene Editor** post-baseline (bindings panel, texture maps, VSIX smoke): **`docs/SCENE_3D_EDITOR.md`**. Broader Course Studio: **content packs v2**, Presentation `courseDiagramId` slides — `presentation/docs/DEVELOPMENT_PLAN.md` §16–17.
