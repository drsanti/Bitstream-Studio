# Sensor Story No-Code Tech Stack Reference

This document captures the agreed reference for a story-driven, live-data sensor application with a no-code drag-and-drop flow editor (Node-RED style) for learning and marketing demos.

## Product Direction

- Build a **Story-driven Demo** with multiple tabs.
- Each tab combines:
  - **Narrative Layer** (Markdown content and images)
  - **Code Layer** (syntax-highlighted snippets)
  - **Live Layer** (real sensor data rendered as UI metrics, plots, and 3D)
- Add a **No-Code Flow Builder** where each sensor is a node and users connect nodes to indicators/transforms/logic.

## Recommended Tech Stack

### Core App

- `react`, `react-dom`
- `typescript`
- `vite`

### Node Editor (Drag and Drop + Wiring)

- `@xyflow/react` (React Flow)

### State Management

- `zustand`

Suggested stores:

- `flowEditorStore` (nodes, edges, selection, viewport)
- `flowRuntimeStore` (live port values, node execution status)
- `sensorStreamStore` (incoming sensor stream snapshots)

### Runtime and Validation

- Custom TypeScript graph runtime (event/tick execution)
- `zod` for graph schema and node config validation
- `nanoid` for IDs
- `lodash-es` (only where needed: debounce/throttle utilities)
- Optional: `comlink` + Web Worker for isolated runtime execution

### Data Visualization

- 2D charts: `recharts` (simple) or `uplot` (high performance)
- 3D visualization: existing `three` + `@react-three/fiber`

### Content Rendering

- Markdown: `react-markdown`
- Markdown extensions: `remark-gfm`
- Optional raw HTML support: `rehype-raw` (with strict sanitization discipline)
- Syntax highlight: `shiki` (preferred quality) or `react-syntax-highlighter` (simple integration)

### Persistence and Sharing

- Local persistence: `localStorage` and/or IndexedDB via `idb-keyval`
- Optional share compression: `lz-string`
- Graph document versioning: include a top-level `version` field

### Testing and Quality

- Unit tests: `vitest`
- E2E flow interactions: `playwright`
- Schema contract tests with `zod`

## Configuration-First Policy (No Hardcode)

All UI and runtime behavior that may change in product evolution must be driven by configuration, not inline hardcoded values.

### Rules

- Do not hardcode visual tokens (colors, spacing, typography, icon styles).
- Do not hardcode semantic mappings (type colors for `number`, `string`, `boolean`, etc.).
- Do not hardcode node labels, default titles, or user-facing copy that may become configurable.
- Do not hardcode per-node default parameters if they are expected to be editable in settings.

### Minimum Config Domains

- Theme tokens (palette, status colors, text colors, border colors)
- Data-type color mapping (`number`, `boolean`, `string`, `vector3`, `quaternion`, `event`)
- Node display metadata (title, icon, category, default visibility)
- Runtime defaults (tick rate, smoothing defaults, threshold defaults)
- Feature flags and experimental toggles

### Suggested Config File Layout

- `src/webview/sensor-studio/config/theme.config.ts`
- `src/webview/sensor-studio/config/data-type-colors.config.ts`
- `src/webview/sensor-studio/config/node-catalog.config.ts`
- `src/webview/sensor-studio/config/runtime-defaults.config.ts`
- `src/webview/sensor-studio/config/feature-flags.config.ts`

### Future Settings UI Integration

Configuration files must be designed so they can be read and updated via a future Settings window.
The Settings UI should update persisted config values without requiring source-code edits.

### Priority-First Implementation Order

Implement these three items first to avoid early technical debt:

1. **Config Schema and Validator**
  - Define Zod schemas for each config domain.
  - Validate at startup; fail safe with fallback defaults.
2. **Config Access Layer**
  - Use a centralized `configService` API (`get`, `set`, `subscribe`).
  - Do not read config files directly from UI components.
3. **Versioning and Migration**
  - Include `configVersion` for each persisted config payload.
  - Add migration handlers for renamed/removed keys.

### Additional Recommended Guardrails

- Use semantic tokens (e.g. `color.dataType.number`) instead of raw hex values in components.
- Add a safe mode when config fails to parse.
- Maintain a small set of golden demo flow fixtures for regression checks.

## No-Code Flow Architecture (MVP)

### Node Categories

- **Input**: BMI270, BMM350, DPS368, SHT40
- **Transform**: scale, clamp, moving-average, threshold, map-range
- **Logic**: compare, AND/OR, debounce, edge-detect
- **Output**: indicator LED, gauge, text, chart, alert/buzzer simulation
- **Utility**: timer, sample-rate limiter, record/playback

### Port Data Types

- `number`
- `boolean`
- `vector3`
- `quaternion`
- `event`
- `string`

Enforce type compatibility for connections. If mismatched, block connection and suggest adapter nodes.

### Suggested Node Lifecycle

- `init()`
- `onInput()`
- `tick()`
- `dispose()`

## Story-Driven Tab Blueprint (Magnetometer First)

1. **Why Magnetometer Matters**
  Use-cases, health badges, live field magnitude.
2. **Raw Signal Playground**
  X/Y/Z + magnitude with smoothing and time-window controls.
3. **Heading Story**
  Heading gauge and explanation of heading pipeline.
4. **Disturbance and Anomaly**
  Baseline vs current field and anomaly state classification.
5. **Calibration Lab**
  Before/after calibration quality and guided tasks.
6. **Build Your App**
  Practical template flows for learners.

## Recommended Build Plan

### Phase 1 (Lean MVP)

- Sensor -> Threshold -> Indicator
- Node connect validation
- Save/load flow locally

### Phase 2

- Transform nodes + chart output
- Template gallery
- Story tab integration with live widgets

### Phase 3

- Worker runtime
- Script/custom function node
- Share/import flow packs

## Notes

- Keep the first release focused on one strong user journey: **connect sensor data to visible outcomes in seconds**.
- Use the same core runtime for both:
  - **Learn Mode** (guided explanation)
  - **Showcase Mode** (clean visual storytelling for demos/marketing)