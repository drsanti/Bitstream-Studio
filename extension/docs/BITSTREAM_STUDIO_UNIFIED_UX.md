# Bitstream Studio — unified UX (all-in-one)

**Status:** Product / UX north star (2026-06-11)  
**Audience:** Instructors, product, and implementers — trainee-facing wording where noted  
**Related:** [`workshop/WORKSHOP_OUTLINE.md`](./workshop/WORKSHOP_OUTLINE.md), [`../src/webview/sensor-studio/docs/DASHBOARD_VIEWPORT_AND_OUTPUT.md`](../src/webview/sensor-studio/docs/DASHBOARD_VIEWPORT_AND_OUTPUT.md), [`../src/webview/sensor-studio/docs/FLOW_DOMAINS.md`](../src/webview/sensor-studio/docs/FLOW_DOMAINS.md), workbench layout library (`../src/webview/ui/workbench/WORKBENCH_LAYOUT_DIALOGS.md`)

---

## One sentence

> **Connect once, see live data everywhere, wire it once, show it many ways.**

Bitstream Studio is **one workshop** with several **lenses** (Telemetry, Sensor Studio, Course Studio, Examples) — not four unrelated products.

---

## Four apps, one journey

Users can enter at any step, but the **recommended story** for workshops and onboarding:

```text
① CONNECT     Sensor Telemetry     “Is data alive?”
② WIRE        Sensor Studio        “How does it flow?”
③ SHOW        Dashboard + Stage    “What does the operator see?”
④ TEACH       Course Studio        “What does the class see?”
```

| App | User question | Job |
|-----|---------------|-----|
| **Sensor Telemetry** | What is the board sending *right now*? | Trust — link, health, readings |
| **Sensor Studio** | How do I turn readings into logic, HMI, and 3D? | Build — one brain, two faces |
| **Course Studio** | How do I package this for a lesson? | Share — pages, embeds, narrative |
| **Applications / Examples** | What already works that I can copy? | Learn — templates, not blank canvas |

### Connection (global cockpit)

Same rules in every app:

1. Toolbar **Bitstream** (TESAIoT DevKit) or **Simulator** (practice) — mutually exclusive  
2. **Link** — live stream on or off  
3. Switch apps — **same stream**, different view  

Workshop wording: **DevKit** / **Practice mode** instead of internal mode names where possible.

---

## Sensor Studio — the creative center

### One graph, two faces (user language)

| Internal | User-facing |
|----------|-------------|
| Flow graph | **Brain** or **Wiring** |
| Dashboard Output | **2D screen** (operator HMI) |
| Scene Output | **3D scene** (digital twin) |

```text
                    ┌──► Dashboard (2D)
Sensors · math · events ──┤
                    └──► Stage (3D)
```

**One document** (`sensor-studio:flow-graph:v1`) stores the graph. Dashboard and Stage are **output surfaces** that read the same nodes and wires. A value can feed **both** (e.g. humidity → gauge and model motion).

Do **not** split into two independent graphs — that duplicates sensors and breaks the unified story.

### Scoped flow views (shipped)

When Dashboard and Stage are on screen together, each can show a **scoped wiring view** (lens upstream of its output node). Storage stays one graph; only the **viewport filter** changes. Shared nodes (e.g. `sensor-input`) may appear in both lenses.

- **2D / 3D** work modes — auto lens on the main Flow strip (`dashboard-output` / `scene-output` upstream).
- **2D+3D** desk — Dashboard and Stage side by side with one shared **Flow** strip; scope chips (**Dashboard / Stage / Full**) on the canvas (`flow-output-lens.ts`).

---

## Work modes (what users choose)

Users pick **what they are doing**, not which of seven panes to juggle.

| Mode | User intent | Primary pane | Flow role |
|------|-------------|--------------|-----------|
| **Wire** | Build the graph | Flow (large) | Main workspace |
| **2D** | Tune operator HMI | Dashboard | Thin strip or tab — “wiring behind this screen” |
| **3D** | Tune digital twin | Stage | Thin strip or tab — “wiring behind this scene” |
| **Twin** | Both surfaces at once | Dashboard + Stage | Scoped flow beside each (later) |

**UI labels (shipped):** `Wire · 2D · 3D · Twin` — not internal editor type ids.

Mode switch should:

1. Focus the right pane  
2. Apply a **desk layout** preset (or restore last layout for that mode)  
3. Set inspector **follow** context to that pane  

Bundled presets today (Layout menu): `default`, `graph-focus`, `stage-focus`, `dashboard-focus`, **`twin-focus`** (scoped flow panes), `dashboard-operator`, `inspector-wide`, `minimal`.

---

## Workspace — “my desk”

Users customize **how panels are arranged**, separate from **what they built** in the graph.

| User need | Mechanism (shipped) |
|-----------|---------------------|
| Resize / reorder panes | Workbench tiling (`persistenceKey: sensor-studio`) |
| Save a favorite arrangement | Layout menu → **Save current layout as…** (up to 12 named layouts) |
| Restore on next visit | Session auto-save + optional **startup layout** |
| Share desk across machines | Export / import `.trn-workbench-layout.json` |
| Quick layouts | Bundled presets (Stage focus, Dashboard focus, Operator, …) |

Flow export can attach `workbenchLayout` so project + desk travel together.

**Copy for UI / workshop:** “Desk layout” not “layout JSON.”

### Workspace extras (shipped)

- **Per–work-mode desk memory** — last Wire / 2D / 3D / Twin arrangement saved in `ternion.sensor-studio.workModeLayout.v1` (`studio-work-mode-layout.ts`).
- **Desk save hint** — Studio overflow menu tip: Layout → Save current layout as…

---

## Inspector — smart context + Pin

The inspector answers: **“What did I select, and what can I change?”**

### Follow mode (default)

| Active pane / selection | Inspector body |
|-------------------------|----------------|
| Dashboard (no node) | Dashboard overview — tabs, layout, widgets list |
| Dashboard widget | Widget fields + link to flow node |
| Stage pick | Object / transform + linked node |
| Flow node | Node tabs (Node, Live, Device, …) |
| Dashboard Output / Scene Output | Layout and commit settings |

Driven today by `activeEditorType` and selection stores; see `NodeInspector.tsx` and `DashboardInspectorPanel.tsx`.

### Pin / Lock

| State | Behavior |
|-------|----------|
| **Follow** (default) | Inspector updates when user clicks another pane or target |
| **Pin** | Inspector **stays** on pinned target until user unpins |

**User story:** Pin the humidity gauge, then click the 3D model to adjust placement without losing gauge fields.

**Phase 1 (shipped):** Single inspector — **Pin** button in header + amber **Pinned · Unpin** banner (`studio-inspector-pin.ts`, `studio-inspector-pin.store.ts`). Supports flow node, Dashboard overview/widget, Stage object, layout node, and canvas overview. Auto-unpins when pinned node is deleted.  
**Phase 2 (shipped):** **Active \| Pinned** tabs when pinned — peek at live selection without unpinning.  
**Phase 3 (shipped):** Pin target persists across refresh (`ternion.sensor-studio.inspectorPin.v1`).

Edge cases: delete pinned node → unpin + empty state; multi-select → pin disabled or pins selection snapshot.

---

## Personas

### Trainee (workshop)

1. Telemetry — see live SHT40 (or Simulator)  
2. Studio — sensor → math → dashboard text (demo template)  
3. Dashboard — Preview, interact  
4. Optional — same value on Stage  
5. Course — instructor page with embedded widget  

**Must not require:** two graphs, manual JSON export, or UART jargon.

### Instructor

1. Simulator for slides; DevKit for live demo  
2. Saved desk **“Teaching twin”** (Dashboard + Stage + pinned inspector)  
3. Course Studio live blocks  
4. Examples as copy-paste starters  

### Builder / integrator

1. Full graph in **Wire** mode  
2. **Twin** desk + pinned inspectors  
3. Export flow + desk layout  
4. Telemetry provider for external HTML (advanced — [`bitstream-telemetry-provider/`](./bitstream-telemetry-provider/README.md))

---

## UX principles (all-in-one)

1. **One live world** — Connection and sensor health are global.  
2. **One brain per project** — One graph feeds 2D and 3D.  
3. **Progressive disclosure** — Telemetry simple → Studio wiring → Course narrative.  
4. **Consistent vocabulary** — Sensor names, units, live/stale/offline match everywhere.  
5. **Mode, not maze** — Wire / 2D / 3D / Twin instead of memorizing pane trees.  
6. **Inspectable everything** — Click → inspector; **Pin** when context would jump away.  
7. **Recoverable desk** — Named layouts so experimentation is safe.  
8. **Board first, Simulator honest** — Always show data source (workshop rule).

---

## North-star user quote

> “I linked the board, saw temperature in Telemetry, wired it in Studio, built a gauge on the Dashboard and saw the model move on Stage — and the teacher put the same thing on the course page.”

---

## Implementation roadmap (UX → engineering)

| Priority | Deliverable | Notes |
|----------|-------------|-------|
| **P0** | Document + workshop links | This file; instructor README |
| **P1** | Mode switcher UI (`Wire · 2D · 3D · Twin`) | **Shipped** — `StudioWorkModeSwitcher`; maps to `graph-focus` / `dashboard-focus` / `stage-focus` / `twin-focus` |
| **P1** | Promote desk save/load in Sensor Studio | **Shipped** — overflow tip + Layout ▾ → Save / Manage |
| **P2** | Inspector **Pin / Follow** | **Shipped** — Pin, Active \| Pinned tabs, localStorage restore |
| **P2** | `dashboard` in layout validator known types | **Done** — `validate-studio-workbench-layout.ts` |
| **P3** | **`twin-focus`** preset | **Shipped** — Dashboard + Stage columns + scoped flow panes |
| **P3** | Scoped flow lenses (one **Flow** pane + dashboard/stage/full scope) | **Shipped** — `flow-output-lens.ts`, `FlowLensSwitcher` in 2D+3D |
| **P4** | Per-mode desk memory | **Shipped** — `studio-work-mode-layout.ts` |
| **P4** | Selection-suggest mode (soft) | **Shipped** — suggest chip on Dashboard/Scene Output select |

Technical references:

- Workbench: `StandaloneWorkbench`, `studio-workbench-presets.ts`, `workbench-layout-library.ts`  
- Focus: `studio-workbench-focus.store.ts`, `studio-runtime-visibility.store.ts`  
- Dashboard: `DASHBOARD_VIEWPORT_AND_OUTPUT.md`, `dashboard-navigation.ts`  
- Stage: `STAGE_VIEWPORT_AND_SCENE_OUTPUT.md`  
- Graph persistence: `flow-graph.repository.ts`

---

## Workshop alignment

Chapter 1 (**WORKSHOP_OUTLINE.md**) introduces four apps — use this doc’s **journey** (Connect → Wire → Show → Teach) as the instructor narrative. Sensor Studio chapters should emphasize **one wiring diagram, two screens** before Course Studio embeds.

---

## Changelog (this document)

| Date | Change |
|------|--------|
| 2026-06-11 | Initial unified UX north star (workspace, inspector pin, work modes, one graph) |
| 2026-06-11 | P1 work mode switcher shipped (`StudioWorkModeSwitcher`, `studio-work-mode.ts`) |
| 2026-06-11 | P2 inspector Pin/Follow Phase 1 (`InspectorPinButton`, `studio-inspector-pin.ts`) |
| 2026-06-11 | P3 Twin work mode + `twin-focus` desk preset (`StudioWorkModeSwitcher`, `studio-workbench-presets.ts`) |
| 2026-06-11 | Scoped flow lenses, per-mode desk memory, pin persistence, Active \| Pinned tabs, work-mode suggest chip |
