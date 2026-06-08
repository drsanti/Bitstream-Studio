# Course Studio — architecture

Course Studio is the **v2 alive-documents** workspace for Bitstream Studio. Presentation v1 (`../presentation/`) remains frozen as a slide-deck backup.

## Layout

```text
course-studio/
  CourseStudioWorkspace.tsx   # workspace entry
  layout/CourseStudioShell.tsx
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

**Diagram maintainer (7c):** Select a `diagram-2d` block → **canvas** drag for static nodes (4px grid + **alignment guides**), **curved connectors** (quadratic `curve` control on line/arrow), **resize handles** (E/S/SE), **line endpoint + curve** handles, stack-order controls, JSON editor + property panel → **Save diagram** (dev API). Bound axes (e.g. proof-mass Y) stay live-driven.

**Edge flow (7g slice):** Dashed connector lines animate when link is healthy; animation pauses when frozen/disconnected (`prefers-reduced-motion` respected).

**3D scenes (7f slice):** Page block `diagram-3d` embeds Presentation R3F presets (`bmi-pcb-orientation`, `axis-triad`, `bmi-gyro-gimbal`) via lazy `CourseDiagram3DSceneHost`. Live scenes use `presentationBmi270FrameRef` (synced by `Bmi270FrameRefSync` in shell). Full `diagram.v1` 3D layers remain backlog.

**Document meta (7g):** Optional `page.meta` — `telemetryPreference` (`auto` | `uart` | `simulator`), `defaultLinkHealth`, `staleMs`. When `staleMs` is set, link health compares `bs2EvtSensorLastRxAtMs` (or firmware RX fallback) against wall clock — stale samples trigger **Stale** badges and diagram `freeze-gray` inactive styling. Shell shows route + data chips via `CourseDocumentStatusBadge`.

**Markdown admonitions (7i slice):** Blockquotes `> **Note:**`, `**Warning:**`, `**Tip:**`, `**Danger:**` render as `PresentationCallout` (same tokens as grid callout blocks) in `PresentationTheoryMarkdown` and Course Studio markdown blocks.

## Maintainer inspector panel

Maintainer mode uses `TRNSidePanel` (`variant="inspector"`) — resizable, collapsible right inspector with width persisted in `localStorage` (`course-studio:maintainer-inspector`). Inner body uses **`TRNTabs`** (Page · Block · Diagram) with **`TRNFormSection`**, **`TRNInput`**, **`TRNTextarea`**, **`TRNSelect`**, **`TRNScrubNumberInput`**, and **`TRNHighlightedJsonTextarea`** — same inspector tab chrome as Sensor Studio (`TRN_INSPECTOR_TAB_*` classes). Collapse to preview the page full-width; expand via the floating **Maintainer** control or **Ctrl+\\** / **Cmd+\\**.

Implementation: `maintainer/CourseMaintainerSidePanel.tsx` (palette + block/diagram inspector).

## Grid composer (Phase 7h slice)

Maintainer mode uses `CoursePageGridComposer` — reuses Sensor Studio dashboard grid math:

- **Drag** handle repositions `column` / `row`
- **Resize** handles (`e`, `s`, `se`) adjust span
- **Block palette** adds new blocks at first open grid slot
- Inspector **Delete** removes a block (page keeps ≥1 block)

## Next phases

Full `diagram.v1` **3D layers** (model nodes, maintainer viewport, shared binding resolver with 2D), **content packs**, validate CLI — see `presentation/docs/DEVELOPMENT_PLAN.md` §16–17.
