# TRN UI Docs Index

This folder contains usage manuals for TRN UI components.

## Manuals

- [TRNContainer User Manual](./TRNContainer.md)
- [TRNSectionContainer User Manual](./TRNSectionContainer.md)
- [TRNWindow User Manual](./TRNWindow.md)
- [TRNToolboxPanel User Manual](./TRNToolboxPanel.md)
- [TRNCard User Manual](./TRNCard.md)
- [TRNInteractiveCard User Manual](./TRNInteractiveCard.md)
- [TRNParameter User Manual](./TRNParameter.md)
- [TRNAccordion User Manual](./TRNAccordion.md)
- [TRNTabs User Manual](./TRNTabs.md)
- [TRNSplitPane User Manual](./TRNSplitPane.md)
- [TRNSortable User Manual](./TRNSortable.md)
- [TRNSortableCard User Manual](./TRNSortableCard.md)
- [TRNCommandPalette User Manual](./TRNCommandPalette.md)
- [TRNDataGrid User Manual](./TRNDataGrid.md)
- [TRNTree User Manual](./TRNTree.md)
- [TRNForm User Manual](./TRNForm.md)
- [TRNSidePanel User Manual](./TRNSidePanel.md)
- [TRNGlassButton User Manual](./TRNGlassButton.md)

## Example Catalog Workflow

- Open catalog from header menu or keyboard shortcut:
  - `Ctrl+K` (Windows/Linux)
  - `Cmd+K` (macOS)
- Catalog window title: `Example Catalog (Ctrl/Cmd+K)`
- Catalog supports:
  - group filters (`All`, `TRNContainer`, `TRNWindow`, `TRNToolboxPanel`, `TRNCard`, `TRNTabs`, `TRNSplitPane`, `TRNCommandPalette`, `TRNDataGrid`, `TRNTree`, `TRNForm`, `AppLayout`, `TRNSidePanel`, `TRNAccordion`, `TRNSortable`, `TRNSortableCard`)
  - search
  - keyboard navigation (`↑`, `↓`, `Enter`, `Esc`)

## Example Registry

Source of truth for example tabs/catalog:

- `../examples/exampleRegistry.ts`

Key exports:

- `TRN_CONTAINER_EXAMPLE_TABS`
- `TRN_WINDOW_EXAMPLE_TABS`
- `TRN_TOOLBOX_PANEL_EXAMPLE_TABS`
- `TRN_CARD_EXAMPLE_TABS`
- `TRN_TABS_EXAMPLE_TABS`
- `TRN_SPLIT_PANE_EXAMPLE_TABS`
- `TRN_ACCORDION_EXAMPLE_TABS`
- `TRN_COMMAND_PALETTE_EXAMPLE_TABS`
- `TRN_DATA_GRID_EXAMPLE_TABS`
- `TRN_TREE_EXAMPLE_TABS`
- `TRN_FORM_EXAMPLE_TABS`
- `TRN_APP_LAYOUT_EXAMPLE_TABS`
- `TRN_SIDE_PANEL_EXAMPLE_TABS`
- `TRN_SORTABLE_EXAMPLE_TABS`
- `TRN_SORTABLE_CARD_EXAMPLE_TABS`
- `TRN_EXAMPLE_CATALOG_ITEMS`

## Public API (Barrel)

Use the TRN barrel file for stable imports:

- `../index.ts`

Example:

```ts
import { TRNTabs, TRNTabsList, TRNTabsTrigger, TRNTabsContent, TRNSplitPane } from "../index.js";
```

## Suggested Reading Order

1. Start with `TRNContainer.md` to understand core layout primitives.
2. Read `TRNSectionContainer.md` for titled sections with optional header slots (icons, actions).
3. Continue with `TRNWindow.md` for draggable/resizable floating window behavior (including **auto height** mode). For **3D viewport toolboxes**, see `TRNToolboxPanel.md` (collapse, edge snap, transparent glass defaults).
4. Read `TRNCard.md` for collapsible card patterns (`simple` and `animated`).
5. Read `TRNInteractiveCard.md` for slot-based interactive card headers with optional collapsible behavior.
5b. Read `TRNParameter.md` for dense label / gauge / value rows (Bitstream sensor telemetry, diagnostics grid, icon pulse).
6. Read `TRNTabs.md` for tabbed navigation and panel transitions.
7. Read `TRNSplitPane.md` for draggable resizable two-pane layouts.
8. Read `TRNAccordion.md` for grouped animated disclosures.
9. Read `TRNCommandPalette.md` for search-driven command lists.
10. Read `TRNDataGrid.md` for sortable/resizable tables.
11. Read `TRNTree.md` for nested expand/collapse trees.
12. Read `TRNForm.md` for `TRNFormSection` / `TRNFormField` / `TRNInlineEdit`.
13. Read `TRNSortable.md` for generic drag/reorder primitives.
14. Read `TRNSortableCard.md` for sortable-card composition and handle positioning.

## Notes

- Examples in both manuals are designed to match the current frontend implementation.
- Keep these docs updated when component props or defaults change.
- Keep registry ids aligned with component tab ids to avoid catalog-to-tab mismatch.
- Keep `TRNSplitPane` recipes in docs aligned with the example tabs shown in catalog.
