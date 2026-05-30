# TRNSplitPane User Manual

`TRNSplitPane` provides two resizable panels with a draggable divider and optional persistence.

## Quick Start

```tsx
<TRNSplitPane
  direction="horizontal"
  defaultSize={0.5}
  primary={<LeftPane />}
  secondary={<RightPane />}
/>
```

## Core Props

- `direction`: `"horizontal" | "vertical"` (default `"horizontal"`).
- `defaultSize`: initial primary pane size (`0..1` ratio or px if `> 1`).
- `size` + `onSizeChange`: controlled mode.
- `minPrimaryPx`, `minSecondaryPx`: pane constraints.
- `dividerSizePx`: draggable divider thickness.
- `persistKey`: save/restore split size in `localStorage`.
- `animated`, `animationDurationMs`: pane resize animation tuning.

## Interaction

- Drag divider to resize.
- Double-click divider to reset to `defaultSize`.
- Keyboard on divider:
  - Horizontal: `ArrowLeft/ArrowRight`
  - Vertical: `ArrowUp/ArrowDown`
  - `Shift` + Arrow for larger step
  - `Home/End` to snap min/max

## Tips

- Use controlled mode when parent layout/state must own pane size.
- Use `persistKey` for tool windows where users expect sticky layout.
- Keep pane content scrollable (`overflow-auto`) for long content.

## Common Layout Recipes

The TRN split-pane examples include practical multi-pane templates:

- `Horizontal Split` and `Vertical Split` for basic two-pane layouts.
- `2 Columns` and `2 Rows` for symmetric dual-section arrangements.
- `Nested 2x2 Grid` for four independently resizable regions.
- `Workbench (Sidebar/Main/Console)` for tool-oriented apps.
- `IDE Layout` for editor-centric workflows.
- `Monitoring Layout` for dashboards with metrics + timeline/logs.

You can find these recipes in:

- `../examples/TRNSplitPaneExample.tsx`
- `../examples/exampleRegistry.ts` (`TRN_SPLIT_PANE_EXAMPLE_TABS`)
