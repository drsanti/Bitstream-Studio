# Course Studio — agent onboarding

**Product:** v2 alive documents workspace (`course-studio`).  
**Presentation v1** (`../presentation/`) is **frozen** — see `../presentation/V1_FROZEN.md`. New features go here.

**Canonical plan:** `presentation/docs/DEVELOPMENT_PLAN.md` §16–17 (repo root).  
**Architecture:** `docs/ARCHITECTURE.md` (this folder).  
**Tracker:** `extension/docs/DEVELOPMENT_TRACKER.md` (Recently completed → Course Studio bullets).

---

## Quick start (another machine)

```bash
cd extension
npm install

# Terminal 1
npm run start:bridge

# Terminal 2
npm run dev:webview
# or: npm start   (dev:clean + vite on 5173)
```

Open: **http://localhost:5173/?workspace=course-studio** (legacy `?workspace=presentation` redirects here)

**Default:** opens book **TESAIoT Embedded** → chapter **BMI270** → first topic **Overview & measurement model** (`bmi270-overview.page.v1.json`). Four topical pages per chapter — see **`docs/COURSE_OUTLINE.md`**.

**Blank authoring:** Maintainer pack controls → reset to empty `blank.page.v1.json`.

**Browser refresh:** unsaved edits are restored from a **localStorage session draft** (course outline, page blocks, diagram Konva canvas state). Workbench pane layout is also persisted under `course-studio`. Use top-bar **Save** (outline + pages) or per-asset **Save** to write JSON into `content/` for permanent repo storage.

**Regression pilot pack:** append `&load=pilot` to load the original single-topic BMI270 accel theory page instead.

The **Presentation** toolbar tab is removed — document authoring lives in Course Studio only.

Enable **Maintainer** in the Course Studio top bar (dev only). Toggle inspector: **Ctrl+\\** / **Cmd+\\**.

### Split-pane workbench

Course Studio uses the shared **`StandaloneWorkbench`** shell (same engine as Sensor Studio):

| Pane | Role |
|------|------|
| **Course Outline** | Book tree — right-click Add chapter/topic/subtopic; click to open page (Maintainer) |
| **Content** | Page grid — edit mode (Maintainer) or view mode (preview) |
| **Inspector** | Page settings, block palette, block fields |
| **Diagram** | 2D infographics canvas + node inspector |
| **Markdown** | Inline or external `.theory.md` editor |
| **3D Scene Editor** | `scene-3d` block viewport + environment; diagram `layers[]` 3D sub-tab |

Use the top-bar **Layout** menu for presets (**Author**, **View**, **Diagram focus**), saved layouts, and reset. Selecting a diagram / markdown / 3D block auto-focuses the matching pane (Maintainer on).

### Element-by-element testing (dev)

1. Open blank Course Studio (default URL above).
2. Enable **Maintainer** → **Inspector** pane → **Page** tab.
3. Use **Add block** buttons in order; the **Element test checklist** tracks which block types are on the page.
4. For each block: verify **Content** pane render, **Inspector → Block** fields, and the matching editor pane (Diagram / Markdown / 3D Scene).
5. Optional regression: `?load=pilot` for the full BMI270 pilot page.

---

## Tests

```bash
cd extension
npx tsx --test --test-force-exit tests/course-studio/*.test.ts
# or:
npm run test:course-studio
npm run presentation:validate
npm run presentation:validate -- --golden
npm run presentation:pack:export -- --page bmi-accel-theory --out dist/pilot.pack.json
npm run presentation:pack:import -- --pack dist/pilot.pack.json
```

**247+ tests** (2026-06-09) — schema, diagrams, Konva freeform, scene.v1 packs, 3D materials, golden validate, blank page bootstrap, Presentation 7e bridge, 3D Scene Editor production baseline.

BS2 suite (unchanged): `npm run test:bitstream2`

---

## What is shipped (2026-06-08)

| Phase | Status | Highlights |
|-------|--------|------------|
| **0** Scaffold | Done | `page.v1` grid, pilot BMI270 accel page, workspace tab, Ctrl+Shift+3/4 → Course Studio |
| **7a** Markdown | Done | External `*.theory.md`, dev save API, inline markdown |
| **7b** Diagrams | Done | `diagram.v1`, `CourseDiagramRenderer`, MEMS pilot JSON |
| **7c** Diagram editor | Done | Konva live canvas (Draw tab) + legacy live SVG bindings (Live tab); canvas drag/resize, curves, z-order, undo |
| **7d** Bindings | Done | Catalog synced with `PresentationBmi270Frame`, MapOp chain, `flowWhen`/`highlightWhen`, new diagram flow |
| **7f** 3D scenes | Done | `scene-3d` block → `scene.v1` documents; **3D Scene Editor** (objects, materials, environment); pack export/import includes `scenes/` — see **`docs/SCENE_3D_EDITOR.md`** |
| **7f** 3D layers (schema + runtime + maintainer) | Done | `layers[]`, composite renderer, Diagram tab **3D layer** viewport + model inspector |
| **7g** Link health | Done | `freeze-gray`, stale badges, edge flow animation |
| **7h** Grid composer | Done | Drag/resize blocks, palette |
| **7i** Admonitions | Done | Markdown callouts via `PresentationCallout` |
| **Validate + packs** | Done | `presentation:validate`; export/import CLI; runtime pack loader; maintainer **Import pack** (dev) |
| **7e** Presentation bridge | Done | `PresentationCourseDiagramEmbed`; BMI270 accel + Euler quaternion theory; reader diagram slot |
| **Maintainer UX** | Done | Frame delete confirm; pop-out diagram editor; 3D group nesting; catalog model preview |
| **Golden validate** | Done | `npm run presentation:validate -- --golden` |

---

## Key paths

```text
course-studio/
  CourseStudioWorkspace.tsx          # entry
  layout/CourseStudioShell.tsx       # shell + Bmi270FrameRefSync
  runtime/BlockRenderer.tsx          # block → UI
  runtime/diagram/                   # 2D SVG + bindings
  maintainer/                        # dev-only editor (import.meta.env.DEV)
  content/
    pilot-bmi-accel-theory.page.v1.json
    pilot-bmi-accel-mems.diagram.v1.json
    pilot-bmi-pcb-orientation.scene.v1.json
    diagramRegistry.ts / diagramTemplates.ts
    sceneRegistry.ts / sceneTemplates.ts
  schemas/page.v1.ts | diagram.v1.ts | scene.v1.ts | presentationPack.v1.ts
  validate/                          # content validation (grid, bindings, refs, scenes)
  dev/run-presentation-validate.ts   # CLI
  dev/run-presentation-pack-export.ts
  ui/catalog/CourseSceneBlockCard.tsx
tests/course-studio/
```

---

## Maintainer workflows

| Action | How |
|--------|-----|
| Edit page layout | Maintainer → drag/resize blocks on grid |
| Edit copy / markdown | Block tab in inspector |
| Edit diagram nodes | Select `diagram-2d` block → **Diagram** pane → **2D canvas** or **3D layer** sub-tabs |
| Edit diagram 3D layer | Select layered `diagram-2d` → **Diagram** pane **3D layer** sub-tab (viewport + gizmo); Inspector → outliner, camera, model fields |
| Edit page 3D scene | Select `scene-3d` block → **3D Scene Editor** pane (add/duplicate/delete objects, gizmo, materials, undo/redo); Inspector → outliner, environment, camera, per-node material |
| New blank diagram | **+ Diagram** palette (dev saves `content/*.diagram.v1.json`) |
| Add 3D scene block | **+ 3D Scene** palette → blank or template scene document |
| Save page + outline | Maintainer **Save** → `save-page` + `save-course` when dirty |
| Save diagram | Diagram tab **Save** → `POST /__dev_api/course-studio/save-diagram` |
| Save scene | 3D Scene Editor toolbar **Save scene** → `POST /__dev_api/course-studio/save-scene` |
| Save markdown | Markdown pane **Save** → `POST /__dev_api/course-studio/save-markdown` |
| Undo | **Ctrl+Z** — page grid or diagram (Diagram tab prefers diagram stack) |

### Ship content to VSIX

1. **Author in dev** — Maintainer on; edit pages, outline, diagrams, scenes, markdown.
2. **Save to repo** — top-bar **Save** (pages + course manifest); per-pane Save for diagram/scene/markdown.
3. **Commit** — `extension/src/webview/course-studio/content/**` (JSON + `.md`).
4. **Package** — `npm run compile && npm run package` (content is bundled at build time).
5. **Verify** — install VSIX; open Course Studio in **View** mode (Maintainer unavailable in packaged build).

Session draft (`localStorage` key `course-studio:maintainer-session-v1`) survives browser refresh but is **not** git/VSIX until step 2–4.

**Diagram canvas:** edit mode uses **static layout** (`designTime` renderer) so selection chrome matches shapes; **page preview** uses **live bindings** (proof mass moves with `aX`).

**Node selection:** top z-order wins on canvas; use **Select node** dropdown for springs/lines. Background node id: **`frame`**.

---

## Live data (do not fork)

Import from `shared/live.ts` → presentation `usePresentationBmi270` etc. → `useBitstreamLiveStore`.

3D scene nodes use the same live binding paths as diagram 3D layers via `presentationBmi270FrameRef` — synced by `Bmi270FrameRefSync` in `CourseStudioShell`.

Dual-runtime: UART vs Simulator — see `extension/docs/TELEMETRY_MODE_LIFECYCLE.md`.

---

## Dev APIs (Vite only)

| Endpoint | Purpose |
|----------|---------|
| `POST /__dev_api/course-studio/save-page` | Write `*.page.v1.json` |
| `POST /__dev_api/course-studio/save-course` | Write `*.course.v1.json` |
| `POST /__dev_api/course-studio/save-diagram` | Write `*.diagram.v1.json` |
| `POST /__dev_api/course-studio/save-markdown` | Write `*.md` under `content/` |
| `POST /__dev_api/course-studio/save-scene` | Write `*.scene.v1.json` |
| `POST /__dev_api/course-studio/import-pack` | Import `.trn-presentation-pack.json` into `content/` |
| `POST /__dev_api/course-studio/reload-content` | Re-read all files from `content/` into the webview |

VSIX: read-only — no maintainer toggle, no save/import APIs. Shipped pilot loads via bundled presentation pack (virtual `pack:` paths).

---

## Next work (pick one)

1. **VSIX smoke** — packaged Course Studio: four sensor chapters, live cards (Simulator), diagram/scene blocks, reader View mode (`HOW_TO_RUN.md`).
2. **Content polish** — per-chapter diagram/scene assets; outline drag-reorder; pack export includes `*.course.v1.json`.
3. **Diagram inspector refactor** — Konva node inspectors → shared `CourseLiveBindingField`.
4. **Presentation 7e expansion** — additional theory slides with `courseDiagramId` as new diagrams ship.

After schema or wire changes: update `tests/course-studio/` and `DEVELOPMENT_TRACKER.md`.

---

## Related rules / skills

| Item | Path |
|------|------|
| Dev runbook | `extension/HOW_TO_RUN.md` |
| Handoff (repo root) | `AGENT_HANDOFF.md` |
| BS2 protocol changes | `.cursor/rules/bs2-protocol-change.mdc` |
| Skill | `.cursor/skills/bitstream-studio-dev/SKILL.md` |
