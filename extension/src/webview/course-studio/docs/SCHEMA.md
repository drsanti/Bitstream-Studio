# Course Studio — `page.v1` schema

Phase 0 document format. Validated with zod in `schemas/page.v1.ts`.

## Top level

```json
{
  "version": 1,
  "id": "bmi-accel-theory",
  "title": "Accelerometer — specific force",
  "grid": {
    "columns": 12,
    "rowHeightPx": 48,
    "gapPx": 12,
    "paddingPx": 32
  },
  "blocks": []
}
```

## Placement (every block)

| Field | Type | Notes |
|-------|------|-------|
| `column` | int 1–48 | 1-based grid column |
| `row` | int 1–200 | 1-based grid row |
| `columnSpan` | int 1–48 | width in columns |
| `rowSpan` | int 1–200 | height in row units |

## Block kinds (Phase 0)

| `kind` | Fields |
|--------|--------|
| `heading` | `eyebrow?`, `title`, `subtitle?` |
| `callout-info` \| `callout-warning` \| `callout-danger` \| `callout-tip` | `title?`, `body`, `icon?` (Lucide name) |
| `markdown` | `markdown` (supports `$$` math via KaTeX) |
| `card` | `title?`, `body` |
| `live-metric` | `title` (BMI270 tri-axis pilot) |
| `diagram-2d` | `diagramId`, `caption?` |

## `diagram.v1` (infographic scene graph)

Validated in `schemas/diagram.v1.ts`. Pilot: `content/pilot-bmi-accel-mems.diagram.v1.json`.

| Node `type` | Role |
|-------------|------|
| `rect`, `ellipse` | Boxes, chips |
| `line`, `arrow` | Connectors; optional `curve: { cx, cy }` for quadratic SVG path |
| `text` | Labels; optional binding |
| `group` | Nested children |

**Styling:** `fill` / `stroke` use theme tokens (`card`, `accent-amber`, `axis-x`, …) — resolved to presentation CSS variables at render time.

**Bindings (v1 slice):** `text.content` and numeric `x`/`y` may reference catalog paths (`bmi270.ax`, …) with optional `MapOp` pipeline (`scale`, `clamp`). Evaluator: `runtime/diagram/evaluateDiagramScene.ts`.

## Parse API

```ts
import { parsePageV1 } from "../schemas/page.v1";

const page = parsePageV1(rawJson);
```

Pilot content: `content/pilot-bmi-accel-theory.ts` (authoring source); JSON export is backlog.
