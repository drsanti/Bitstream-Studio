# GLB Animation Lab — manual smoke checklist

Run with **`npm run dev:webview`** → `http://localhost:5173/?app=bitstream` (or VSIX) → **Sensor Telemetry** workbench → **Digital Twin** pane → **Machine Twin** card.

Prerequisite: **Tesa Drone** (or another multi-clip GLB) in the free-pack mirror (`__ternion_user_free/models/tesa-drone/tesa-drone.glb`).

## Placement

- [ ] Model sits on / above the grid like Blender (authored export transform; not half submerged)
- [ ] Package picker switches models without stale GLB / TESAIoT fallback

## Clips and transport

- [ ] Inspector lists all GLTF clips (Tesa Drone: 7)
- [ ] **Per-clip** — select `gimbal1Action` (or one gimbal clip); Play animates only that clip
- [ ] **Parallel-all** — default on animated model load; auto **Play** + **Loop**; overlap panel shows risk if pairs share bones
- [ ] **Sequence** — clips advance one-by-one; reorder (↑↓) changes order
- [ ] Play / Pause / Stop
- [ ] Scrub timeline while paused; live readout updates time · frame

## Studio mixer (default engine)

- [ ] Weight / speed / loop / trim / fade affect active clip
- [ ] Solo cross-fade on clip change (per-clip mode)
- [ ] **Legacy** engine toggle still plays parallel-all / solo (Phase A path)

## Catalog metadata (optional)

Bundled in dev: `extension/src/webview/assets/free/models/tesa-drone/tesa-drone_metadata.json` (or copy the example beside your GLB as `tesa-drone_metadata.json`), reload:

- [ ] “Catalog hints applied” banner; default clip + mode from JSON
- [ ] **Machine Twin** panel lists gimbal / propulsion / IMU groups (not only clip heuristic)

## Machine Twin + 3D tags

- [ ] **Machine** inspector tab: overall health pill + subsystem rows
- [ ] Select subsystem → clip row matches `glbAnchor`
- [ ] Viewport **Tags** toggles hide/show; **Filter** menu sets **All** / **Issues** / **Warnings & errors** / **Errors only** / **Hidden** (defaults **Issues** for 6+ subsystems when no saved pref)
- [ ] Tag click selects subsystem (same as **Machine** tab)
- [ ] Toolbar tag filter persists (`twin-tag-filter-mode`); legacy `alerts-only` migrates to **Issues**
- [ ] **Environment map** (globe): pick **Park** (or other preset) → cubemap visible as scene background (not solid black)
- [ ] Inspector **Tag style** tab: label sharpness (Auto / 1×–3×), opacity, crisp text, scanlines, preset, layout sliders, global icons — survives reload
- [ ] Inspector **Components** tab: per-subsystem title, offsets, visibility, colors — survives reload
- [ ] **Display language** (EN / ไทย) on Tag style tab; mapping column headers follow locale
- [ ] Card icons are **glyph only** (no icon box border or background); motors spin / gimbals sweep when animation is Full
- [ ] **Bracket tactical** preset → icon in top-right corner; other presets → icon left of title
- [ ] Inspector sidebar is **resizable** (drag left edge); width persists

## Live mapping (operator overrides)

- [ ] Inspector **Live map** tab: Parameter | Sensor | Sub-parameter columns; sortable subsystem cards
- [ ] Tap parameter name (●) → primary line on 3D tag; mapping persists per asset (`localStorage`)
- [ ] Sensor dropdowns flip above trigger when near viewport bottom (not clipped)
- [ ] With Bitstream or Simulator streaming: row preview shows live / stale / sim status

## Live telemetry (Phase C)

With **Bitstream** or **Simulator** connected, handshake passed, and EVT_SENSOR streaming:

- [ ] Machine Twin header shows **Live** or **Mixed** (not only Simulated)
- [ ] Flight IMU temperature / vibration track BMI270 when `liveSourceKey` is in metadata
- [ ] Motor/gimbal channels remain simulated until wire keys exist
- [ ] Disconnect or stop stream → returns to **Simulated** within ~5 s

## Maintenance log, trends, export (Phase D)

- [ ] Select a subsystem → each signal shows a sparkline (fills over ~60 s)
- [ ] After ~45 s demo fault (or manual threshold breach) → **Maintenance log** row appears
- [ ] When value returns OK → log row shows **cleared** time
- [ ] **Copy report** → JSON on clipboard (`schema`: `bitstream.animation-lab.twin-report`)

## Dev compare

- [ ] **Copy load URL** in inspector → paste in browser or Model Catalog preview
- [ ] Same motion in **Sensor Studio → Model Viewer** when that node loads the same catalog model (Studio mixer reference)

When all pass, check the smoke item in **`GLB_ANIMATION_LAB.md`** Phase A.
