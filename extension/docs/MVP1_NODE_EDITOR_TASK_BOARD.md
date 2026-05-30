# MVP1 Node Editor Task Board

This document tracks the end-to-end task plan for MVP1:
single-page Node Editor with in-canvas outputs (Indicator, Gauge, Sparkline), without 3D and story mode.

## Scope

### In Scope

- Single-page Node Editor
- Sensor input to live runtime pipeline
- Transform nodes (`MapRange`, `Clamp`, `LowPass`, `Threshold`)
- Output nodes (`Indicator`, `Gauge`, `Sparkline`, `DebugValue`)
- Save/load graph and layout state

### Out of Scope

- 3D object binding
- Separate dashboard mode
- Story tabs and markdown narrative mode
- Custom script nodes

---

## Phase 0 - Project Setup (Foundation)

### Tasks

- [ ] Finalize MVP1 scope and non-goals
- [ ] Confirm required dependencies
- [ ] Create initial folder skeleton
- [ ] Define naming and TypeScript conventions
- [ ] Define configuration domains and ownership (`theme`, `node-catalog`, `runtime-defaults`, `feature-flags`)

### Deliverables

- MVP1 spec (1 page)
- Architecture sketch
- Base project skeleton

### Exit Criteria

- Team alignment achieved, implementation can start

---

## Phase 1 - Core Domain and Schema

### Tasks

- [ ] Define graph types (`Node`, `Edge`, `Port`, `NodeConfig`)
- [ ] Define port types (`number`, `boolean`, `event`)
- [ ] Implement `flow.schema` with Zod
- [ ] Implement config schemas with Zod (`theme.config.schema`, `node-catalog.schema`, `runtime-defaults.schema`)
- [ ] Implement edge connection validation rules
- [ ] Define node lifecycle contract (`init`, `onInput`, `tick`, `dispose`)

### Deliverables

- `core/graph/*`
- `core/schema/flow.schema.ts`
- `core/schema/config/*.schema.ts`
- Validation tests

### Exit Criteria

- Type-safe connections enforced at editor level

---

## Phase 2 - Editor UI (Single Page)

### Tasks

- [ ] Build layout: Palette / Canvas / Inspector
- [ ] Implement drag-and-drop node creation
- [ ] Implement edge creation and deletion
- [ ] Implement node selection and inspector editing
- [ ] Add toolbar actions (`save`, `load`, `reset`)
- [ ] UI consumes config via `configService` only (no direct config object imports in view components)

### Deliverables

- `features/editor/components/*`
- `features/editor/store/flow-editor.store.ts`

### Exit Criteria

- Users can create, connect, edit, and delete nodes/edges

---

## Phase 3 - Runtime Engine (Live Execution)

### Tasks

- [ ] Implement runtime engine v1
- [ ] Implement sensor input adapter
- [ ] Implement transform nodes:
  - [ ] `MapRange`
  - [ ] `Clamp`
  - [ ] `LowPass`
  - [ ] `Threshold`
- [ ] Add runtime state (`running`, `stopped`, `error`)

### Deliverables

- `core/runtime/*`
- `features/runtime/*`

### Exit Criteria

- Live values flow from sensor inputs through transform chain

---

## Phase 4 - Output Nodes (In-Canvas Dashboard)

### Tasks

- [ ] Implement `IndicatorNode`
- [ ] Implement `GaugeNode`
- [ ] Implement `SparklineNode`
- [ ] Implement `DebugValueNode`
- [ ] Apply UI polish for readability and stable layout

### Deliverables

- `features/editor/nodes/output/*`

### Exit Criteria

- End-to-end flow demo works in one page:
  `Sensor -> Transform -> Indicator/Gauge/Sparkline`

---

## Phase 5 - Persistence and Session

### Tasks

- [ ] Save/load graph data (local storage or IndexedDB)
- [ ] Persist panel/splitter layout state
- [ ] Persist last opened workspace
- [ ] Add graph schema versioning
- [ ] Add `configVersion` + migration pipeline for persisted configuration
- [ ] Add fallback-to-default safe mode on invalid config payloads

### Deliverables

- `persistence/workspace.repository.ts`
- Migration/fallback logic
- `persistence/config.repository.ts`

### Exit Criteria

- App reload restores graph and layout reliably

---

## Phase 6 - Stabilization and QA

### Tasks

- [ ] Unit tests for schema and runtime transforms
- [ ] Integration tests for editor-runtime flow
- [ ] Continuous stream stress test (10+ minutes)
- [ ] Runtime error fallback behavior
- [ ] Keyboard/mouse UX polish

### Deliverables

- Test suite
- Smoke checklist
- Known issues list

### Exit Criteria

- No critical crash in continuous demo run

---

## Phase 7 - Demo Readiness (MVP1 Close)

### Tasks

- [ ] Prepare 3 template flows:
  - [ ] Threshold alert
  - [ ] Smoothed gauge
  - [ ] Trend monitor
- [ ] Write quick-start guide (1 page)
- [ ] Final pass on UX and wording

### Deliverables

- Demo script
- Quick-start documentation

### Exit Criteria

- New user can build first working flow in ~2 minutes

---

## Suggested Timeline

- Week 1: Phase 0-2
- Week 2: Phase 3-4
- Week 3: Phase 5-6
- Week 4: Phase 7 + bugfix buffer

---

## Backlog (Post-MVP1)

- 3D object binding via metadata names
- Separate dashboard mode
- Story mode with markdown chapters
- Worker runtime (`comlink`/Web Worker)
- Custom scripting nodes

