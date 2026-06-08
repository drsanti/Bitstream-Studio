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

Open: **http://localhost:5173/?workspace=course-studio**

Enable **Maintainer** in the Course Studio top bar (dev only). Toggle inspector: **Ctrl+\\** / **Cmd+\\**.

---

## Tests

```bash
cd extension
npx tsx --test --test-force-exit tests/course-studio/*.test.ts
```

**54 tests** (2026-06-08) — page schema, diagrams, bindings, undo, 3D block, markdown.

BS2 suite (unchanged): `npm run test:bitstream2`

---

## What is shipped (2026-06-08)

| Phase | Status | Highlights |
|-------|--------|------------|
| **0** Scaffold | Done | `page.v1` grid, pilot BMI270 accel page, workspace tab, Ctrl+Shift+4 |
| **7a** Markdown | Done | External `*.theory.md`, dev save API, inline markdown |
| **7b** Diagrams | Done | `diagram.v1`, `CourseDiagramRenderer`, MEMS pilot JSON |
| **7c** Diagram editor | Done | Canvas drag/resize, curves, z-order, undo/redo, alignment snap, design-time canvas |
| **7d** Bindings | Done | Catalog synced with `PresentationBmi270Frame`, MapOp chain, `flowWhen`/`highlightWhen`, new diagram flow |
| **7f** 3D (slice) | Done | `diagram-3d` page block → Presentation R3F scenes |
| **7g** Link health | Done | `freeze-gray`, stale badges, edge flow animation |
| **7h** Grid composer | Done | Drag/resize blocks, palette |
| **7i** Admonitions | Done | Markdown callouts via `PresentationCallout` |

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
    diagramRegistry.ts / diagramTemplates.ts
    course3dSceneCatalog.ts
  schemas/page.v1.ts | diagram.v1.ts | course3dScene.ts
  ui/catalog/CourseDiagram3DCard.tsx
tests/course-studio/
```

---

## Maintainer workflows

| Action | How |
|--------|-----|
| Edit page layout | Maintainer → drag/resize blocks on grid |
| Edit copy / markdown | Block tab in inspector |
| Edit diagram nodes | Select `diagram-2d` block → **Diagram** tab → canvas + node inspector |
| New blank diagram | **+ Diagram** palette (dev saves `content/*.diagram.v1.json`) |
| Add 3D scene | **+ 3D scene** palette → pick scene in Block inspector |
| Save page | Maintainer **Save** → `POST /__dev_api/course-studio/save-page` |
| Save diagram | Diagram tab **Save** → `POST /__dev_api/course-studio/save-diagram` |
| Undo | **Ctrl+Z** — page grid or diagram (Diagram tab prefers diagram stack) |

**Diagram canvas:** edit mode uses **static layout** (`designTime` renderer) so selection chrome matches shapes; **page preview** uses **live bindings** (proof mass moves with `aX`).

**Node selection:** top z-order wins on canvas; use **Select node** dropdown for springs/lines. Background node id: **`frame`**.

---

## Live data (do not fork)

Import from `shared/live.ts` → presentation `usePresentationBmi270` etc. → `useBitstreamLiveStore`.

3D scenes use `presentationBmi270FrameRef` — synced by `Bmi270FrameRefSync` in `CourseStudioShell`.

Dual-runtime: UART vs Simulator — see `extension/docs/TELEMETRY_MODE_LIFECYCLE.md`.

---

## Dev APIs (Vite only)

| Endpoint | Purpose |
|----------|---------|
| `POST /__dev_api/course-studio/save-page` | Write `*.page.v1.json` |
| `POST /__dev_api/course-studio/save-diagram` | Write `*.diagram.v1.json` |
| `POST /__dev_api/course-studio/save-markdown` | Write `*.md` under `content/` |

VSIX: read-only — no maintainer toggle, no save APIs.

---

## Next work (pick one)

1. **7f (remaining)** — `diagram.v1` 3D **layers** (model nodes, maintainer 3D viewport, shared binding resolver with 2D).
2. **Content packs** — `.trn-presentation-pack` import/export; VSIX consume read-only.
3. **`presentation:validate` CLI** — zod validate page/diagram/markdown trees.
4. **7e** — embed Course diagrams into Presentation v1 theory slides (optional bridge).
5. **UX** — confirm before deleting `frame`; optional pop-out diagram editor.

After schema or wire changes: update `tests/course-studio/` and `DEVELOPMENT_TRACKER.md`.

---

## Related rules / skills

| Item | Path |
|------|------|
| Dev runbook | `extension/HOW_TO_RUN.md` |
| Handoff (repo root) | `AGENT_HANDOFF.md` |
| BS2 protocol changes | `.cursor/rules/bs2-protocol-change.mdc` |
| Skill | `.cursor/skills/bitstream-studio-dev/SKILL.md` |
