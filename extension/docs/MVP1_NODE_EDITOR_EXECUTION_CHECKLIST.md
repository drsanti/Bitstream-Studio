# MVP1 Node Editor Execution Checklist (Day-by-Day)

This checklist operationalizes `MVP1_NODE_EDITOR_TASK_BOARD.md` into daily execution steps.
Use this as the sprint driver for implementation and standup updates.

## Sprint Goal

Deliver MVP1 as a single-page Node Editor with:

- Live sensor input
- Typed node graph execution
- In-canvas output nodes (`Indicator`, `Gauge`, `Sparkline`, `DebugValue`)
- Local save/load of workspace and layout

## Working Rules

- Keep scope strict: no 3D, no story mode in MVP1.
- Merge small, testable increments.
- Every day ends with a runnable app state.
- Prefer strict TypeScript typing; avoid `any`.

---

## Day 1 - Scope Lock and Skeleton

### Build

- [ ] Confirm final MVP1 feature list and non-goals
- [ ] Create `sensor-studio` folder skeleton
- [ ] Add initial stores and placeholder app shell
- [ ] Wire route/entry point for Node Editor page
- [ ] Define config domains and initial config file map

### Verify

- [ ] App builds successfully
- [ ] New Node Editor page loads without runtime errors

### Output

- [ ] PR/commit note with folder and bootstrapping summary

---

## Day 2 - Graph Types and Schema

### Build

- [ ] Implement graph core types (`Node`, `Edge`, `Port`, `NodeConfig`)
- [ ] Define port type enum (`number`, `boolean`, `event`)
- [ ] Create Zod flow schema and parser helpers
- [ ] Add graph version field
- [ ] Add Zod schemas for config payloads and startup parse helpers

### Verify

- [ ] Unit tests for valid/invalid flow schema
- [ ] Invalid payloads fail with clear error messages

### Output

- [ ] Typed schema baseline ready for editor/runtime integration

---

## Day 3 - Connection Validation and Node Contracts

### Build

- [ ] Implement connection compatibility matrix
- [ ] Add editor-side edge validation hook
- [ ] Define node runtime contract (`init`, `onInput`, `tick`, `dispose`)
- [ ] Add node registry interface
- [ ] Implement `configService` API (`get`, `set`, `subscribe`)

### Verify

- [ ] Invalid edge connection is blocked in UI
- [ ] Valid edge connects successfully

### Output

- [ ] Type-safe connection rules enforced in editor

---

## Day 4 - Editor Canvas Core

### Build

- [ ] Implement layout: Palette / Canvas / Inspector
- [ ] Implement drag-and-drop node creation
- [ ] Implement node select/deselect and delete
- [ ] Implement edge create/delete

### Verify

- [ ] User can create, connect, delete nodes and edges
- [ ] No canvas state corruption after rapid edits

### Output

- [ ] Core interaction loop is functional

---

## Day 5 - Runtime Engine v1

### Build

- [ ] Implement runtime execution loop in main thread
- [ ] Add runtime state machine (`stopped`, `running`, `error`)
- [ ] Implement input node adapter contract
- [ ] Implement value propagation between connected nodes

### Verify

- [ ] Runtime starts/stops reliably
- [ ] Connected nodes receive propagated values

### Output

- [ ] Minimal end-to-end runtime path active

---

## Day 6 - Transform Nodes

### Build

- [ ] Implement `MapRange`
- [ ] Implement `Clamp`
- [ ] Implement `LowPass`
- [ ] Implement `Threshold`
- [ ] Add config forms for each transform in Inspector

### Verify

- [ ] Unit tests for transform logic edge cases
- [ ] Live sensor value visibly changes through transform chain

### Output

- [ ] Core transform toolbox complete

---

## Day 7 - Sensor Input Integration

### Build

- [ ] Implement sensor stream adapter to runtime input nodes
- [ ] Add live stream status indicators (connected/rate/error)
- [ ] Add simple monitor values in Inspector

### Verify

- [ ] At least one real sensor stream updates runtime continuously
- [ ] Runtime remains stable over a 10-minute run

### Output

- [ ] First real live-data demo path complete

---

## Day 8 - Output Nodes (Indicator + Gauge)

### Build

- [ ] Implement `IndicatorNode` UI and behavior
- [ ] Implement `GaugeNode` UI and behavior
- [ ] Add value formatting options (precision/unit)

### Verify

- [ ] Threshold + Indicator demo works on live data
- [ ] Gauge updates smoothly and remains readable

### Output

- [ ] In-canvas visual feedback for processed values

---

## Day 9 - Output Nodes (Sparkline + DebugValue)

### Build

- [ ] Implement `SparklineNode`
- [ ] Implement `DebugValueNode`
- [ ] Add sample window settings for sparkline

### Verify

- [ ] Sparkline renders stable trend from live stream
- [ ] Debug node shows exact propagated values

### Output

- [ ] Output node set for MVP1 is complete

---

## Day 10 - Persistence (Graph + Layout)

### Build

- [ ] Save/load graph to local persistence
- [ ] Persist panel layout (sizes/collapsed state)
- [ ] Restore last workspace on app reload
- [ ] Add schema migration guard for old versions
- [ ] Add config persistence with `configVersion`
- [ ] Add config migration handlers and safe fallback defaults

### Verify

- [ ] Reload restores graph and layout correctly
- [ ] Corrupted data falls back safely without crash
- [ ] Invalid config payload enters safe mode and logs a non-blocking warning

### Output

- [ ] Workspace persistence complete

---

## Day 11 - QA Pass 1 (Functional)

### Build

- [ ] Add integration tests for editor-runtime loop
- [ ] Add tests for connection validation and transform output
- [ ] Add smoke test script for main user journeys

### Verify

- [ ] No critical failure in core workflows
- [ ] Test suite passes in CI/local

### Output

- [ ] Functional quality baseline established

---

## Day 12 - QA Pass 2 (Stability and UX)

### Build

- [ ] Long-run runtime stability test (10-15 minutes)
- [ ] Keyboard and pointer interaction polish
- [ ] Improve error messaging and empty states

### Verify

- [ ] No crash during long-run stream test
- [ ] Basic UX feels responsive and predictable

### Output

- [ ] Demo-stable build candidate

---

## Day 13 - Demo Templates and Quick Start

### Build

- [ ] Add starter flow: `Sensor -> Threshold -> Indicator`
- [ ] Add starter flow: `Sensor -> LowPass -> Gauge`
- [ ] Add starter flow: `Sensor -> Sparkline`
- [ ] Write quick-start usage notes

### Verify

- [ ] New user can reach first success in ~2 minutes

### Output

- [ ] Demo-ready templates and onboarding notes

---

## Day 14 - Freeze, Final QA, and Release Prep

### Build

- [ ] Triage and fix remaining P1/P2 issues
- [ ] Final visual and wording pass
- [ ] Tag MVP1-ready build

### Verify

- [ ] End-to-end demo script runs without blocking issues
- [ ] Known issues documented

### Output

- [ ] MVP1 release candidate

---

## Daily Standup Update Template

Use this format for each day:

- **Plan:** what will be implemented today
- **Done:** what was completed yesterday
- **Blockers:** technical or product blockers
- **Decision Needed:** any pending product/architecture decision

---

## Definition of Done (MVP1)

MVP1 is complete when all conditions are met:

- [ ] Single-page Node Editor is fully functional
- [ ] Real sensor input flows through runtime
- [ ] Transform nodes are configurable and correct
- [ ] Output nodes (`Indicator`, `Gauge`, `Sparkline`, `DebugValue`) work in canvas
- [ ] Save/load graph and layout are reliable
- [ ] No critical crash in 10+ minute live demo run
- [ ] Quick-start templates and notes are available

