# Course outline and reader shell

Course Studio separates **navigation** (`*.course.v1.json`) from **page content** (`*.page.v1.json`). Authors work in **Edit** mode with a course outline pane; readers use **View** mode with a rustdoc-style table of contents.

## Content model

| Artifact | Role |
|----------|------|
| `*.course.v1.json` | Book manifest — hierarchical outline only |
| `*.page.v1.json` | One scrollable grid per topic/subtopic (existing block model) |

### Node kinds

```
book
 └── chapter
      ├── topic (pageId) — leaf page or parent of subtopics
      └── subtopic (pageId) — leaf page only
```

Rules enforced by `parseCourseV1`:

- **book** — root only; children are chapters; no `pageId`
- **chapter** — children are topics (or subtopics); no `pageId`
- **topic** — either a `pageId` **or** subtopic children (not both)
- **subtopic** — must have `pageId`; no children

Pilot manifest: `content/tesaiot-embedded.course.v1.json` — book **TESAIoT Embedded**, four sensor chapters (each: four topical pages — overview → hardware/signal → live visualization → applications):

| Chapter | Topics (each → one `*.page.v1.json`) |
|---------|----------------------------------------|
| **BMI270** — inertial measurement | Overview & measurement model · MEMS design & signal quality · Live visualization · Applications & dashboards |
| **BMM350** — magnetometer | Overview · Field geometry & calibration · Live visualization · Applications |
| **DPS368** — barometric pressure | Overview · MEMS & altitude model · Live visualization · Applications |
| **SHT40** — humidity & temperature | Overview · Comfort & signal quality · Live visualization · Applications |

**Convention:** chapters contain **topics** (outline nodes with `pageId`). Each topic is one scrollable page — not audience tracks (Student/Engineer/Programmer). Split by subject matter (concept → hardware → live visuals → applications). This book teaches **sensor physics and operator-facing visuals** — not firmware, protocols, or backend services. Prefer Sensor Studio / Dashboard node wiring over code blocks.

## Topic page authoring — block palette

Each topic is one `*.page.v1.json` grid. **Choose blocks by what the topic needs to teach**, not by a fixed template. Maintainer mode opens the matching editor when you select a block:

| Block | Editor pane | Use when the topic needs… |
|-------|-------------|---------------------------|
| **Heading** | Page Editor | Chapter/topic title and scope line |
| **Markdown** | Markdown Editor | Prose, equations, tables (`src` file or inline) |
| **Callout** (info / tip / warning / danger) | Page Editor | Prerequisites, lab steps, cautions |
| **Card** | Page Editor | Short reference, checklist, summary |
| **Code** | Page Editor | Rare — avoid for TESAIoT Embedded; prefer live blocks and Sensor Studio |
| **Live metric** | Page Editor (live) | Tri-axis readout bound to telemetry |
| **Diagram** (`diagram-2d`) | Diagram Editor | Konva infographics, sensor bindings, MEMS illustrations |
| **3D Scene** (`scene-3d`) | 3D Scene Editor | GLB orientation, materials, quaternion bindings |
| **Image** | Page Editor | Photos, static figures |
| **YouTube / iFrame** | Page Editor | External video or embedded tools |

### Authoring workflow

1. **Outline** — add or select the topic; Course Studio loads its page.
2. **Page Editor** — add blocks from the inspector palette; arrange grid placement.
3. **Markdown / Diagram / 3D Scene** panes — edit the asset referenced by the selected block (`src`, `diagramId`, `documentId`).
4. **Save** — page JSON plus any dirty diagram/scene/markdown files (dev API).

### BMI270 example — blocks per topic

| Topic | Blocks used |
|-------|-------------|
| Overview & measurement model | heading, callout-info, **markdown**, **live-metric**, dashboard widgets, card |
| MEMS design & signal quality | heading, callout-warning, **markdown**, dashboard widgets, card, **diagram-2d** |
| Live visualization | heading, callout-tip, **markdown**, **sensor-telemetry-card** ×2, **scene-3d**, **diagram-2d** ×2, dashboard widgets |
| Applications & dashboards | heading, callout-tip, **markdown**, **sensor-telemetry-card** ×2, dashboard widgets, card ×2 |

The same diagram asset (e.g. `pilot-bmi-accel-mems`) may appear on more than one topic page when context differs (MEMS theory vs full bench layout).

### Guidelines

- **One topic ≈ one learning objective** — if you need many unrelated block types, consider splitting into another topic.
- **Live blocks** need Bitstream or Simulator; set page `meta.telemetryPreference` and link-health as needed.
- **Diagram / scene** blocks reference documents by id — create or duplicate diagrams in the Diagram/3D editors, then wire `diagramId` / `documentId` on the block.
- Prefer **markdown files** under `content/` for long prose; use **inline markdown** only for short callouts on the page.

## Maintainer (Edit) UX

The **Course Outline** workbench pane is the primary navigation surface for authors.

| Action | How |
|--------|-----|
| Open a page | Click a topic/subtopic node |
| Add chapter / topic / subtopic | Right-click node (or empty outline area) → **Add** |
| Rename | Double-click node, or right-click → **Rename…** |
| Duplicate | Right-click → **Duplicate** (clones node + page in memory; persist on **Save**) |
| Delete | Right-click → **Delete** |
| Breadcrumb | Outline header shows `Chapter › Topic` for the active node |
| Unsaved state | Amber dot on active node when the page is dirty; outline title shows **Unsaved outline** when the manifest changed |
| Save | Top bar **Save** writes both dirty page JSON and dirty course manifest (dev API) |
| Browser refresh | Unsaved outline + pages restore from **localStorage session draft** (same tab); use **Save** for permanent repo storage |

After **Add topic/subtopic**, Course Studio:

1. Allocates a new `pageId` and `*.page.v1.json` path
2. Registers a starter page (heading block) in memory — **no disk write until Save**
3. Selects the new node and focuses the **Page Editor**

Use top-bar **Save** to write new page JSON and the course manifest together (dev API).

Default author workbench layout (v5): **Course Outline** | 2×2 editor grid | **Inspector**.

## Reader (View) UX

When maintainer mode is off, `CourseReaderShell` replaces the workbench:

- **Left TOC** — same tree as the outline; click to load pages
- **Resizable sidebar** — drag the separator; width persisted in `localStorage`
- **Hide/show contents** — toolbar control above the reading column
- **Main column** — `CoursePageRenderer` (read-only; no grid handles)

Top bar subtitle shows the breadcrumb path. Theme toggle remains available.

## Dev APIs

| Endpoint | Body |
|----------|------|
| `POST /__dev_api/course-studio/save-course` | `{ sourcePath, course }` |
| `POST /__dev_api/course-studio/save-page` | `{ sourcePath, page }` (unchanged) |

Paths must live under `src/webview/course-studio/content/` with the correct suffix.

## Code map

| Area | Path |
|------|------|
| Schema | `schemas/course.v1.ts` |
| Tree helpers | `runtime/course/courseOutlineTree.ts` |
| Registry | `content/courseRegistry.ts` |
| Outline store | `maintainer/useCourseOutlineStore.ts` |
| Outline UI | `maintainer/CourseOutlinePane.tsx` |
| Reader shell | `reader/CourseReaderShell.tsx` |
| Validation | `validate/courseContentValidate.ts` (orphan `pageId` in courses) |

## URL parameters

- `?course=tesaiot-embedded` — load bundled course manifest (default)
- `?course=bmi270` — legacy alias for the same manifest
- Future: `&page=<pageId>` deep-link to a topic page

## Backlog

- [x] BMI270 chapter: topical pages (overview, MEMS, live viz, host protocol)
- [x] Topical markdown per page (`bmi270-overview.theory.md`, …)
- [x] Session draft: persist/restore course manifest + active outline node (+ runtime pages; merge bundled chapters on restore)
- [ ] Pack export: include `*.course.v1.json` and validate all referenced pages
- [ ] Reader: prev/next footer, in-book search
- [ ] Move up/down, drag-reorder outline nodes
