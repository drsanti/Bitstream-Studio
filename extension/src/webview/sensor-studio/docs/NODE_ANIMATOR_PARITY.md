# node-animator parity (Sensor Studio flow editor)

Reference project: `D:\CODE\2026\node-animator` (`apps/node-animator/`).

This document tracks editor UX and catalog parity — **not** a 1:1 port of all 54 node-animator node types. Bitstream Studio keeps **telemetry (Domain A)** nodes and grows **scene / events / material (B–D)** per [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md).

## Catalog comparison

| | node-animator | Sensor Studio |
|---|---------------|---------------|
| Addable catalog entries | 54 (52 root) | 53 |
| Palette categories | 14 (Blender GN–style) | 7 schema categories + sensor subgroups |
| React Flow node types | 74 | 1 (`studio` card) |

**Target:** keep 53+ telemetry/scene nodes; add **layout** nodes (reroute, frame, note) and scene parity incrementally — not full simulation/physics catalog unless Digital Twin phases require it.

## Phase 1 — Editor UX (shipped)

| Feature | Reference | Sensor Studio |
|---------|-----------|---------------|
| **Shift+A** add-node menu | `FlowEditor.tsx`, `ContextMenu.tsx` | `FlowAddNodeMenu.tsx`, `SensorStudioMain.tsx` |
| Search + category browse | Two-column `ContextMenu` | Same pattern, 7 categories |
| Spawn at pointer | `screenToFlowPosition` | `addNodeFromCatalogAt` / linked spawn |
| Right-click canvas | Pane menu → Add node | Opens add-node menu |
| Esc closes menu first | Yes | Yes |
| Delete selection | RF default | `deleteKeyCode` on React Flow |
| Focus guard | `graphKeyboard.ts` | `is-flow-keyboard-target.ts` |

### Key files

- `features/editor/components/FlowAddNodeMenu.tsx`
- `features/editor/components/FlowCanvas.tsx` — pointer tracking, menu host
- `features/editor/keyboard/is-flow-keyboard-target.ts`
- `features/editor/keyboard/resolve-add-node-menu-anchor.ts`
- `app/SensorStudioMain.tsx` — Shift+A, Esc priority

## Phase 2 — Shipped

- Central `flow-keyboard-shortcuts.ts` registry + `useFlowKeyboardShortcuts` hook
- Recent nodes in add menu (`sensor-studio:recent-nodes` localStorage)
- `nodePaletteLayout` wired from runtime defaults + Library layout switcher
- `palette-display-meta.ts` — 9-group display taxonomy in Shift+A menu

## Phase 3 — Planned

- `reroute` (+ **R** at pointer)
- `frame`, `note`, `split`
- Virtual **Layout** section in add menu

## Phase 4+ — Scene / clipboard

- Socket-colored edges while connecting
- Subgraph-aware clipboard (`flowClipboard.ts` port)
- Group / Tab drill-in (defer until subgraph epic)

## Shortcuts (current)

| Shortcut | Action |
|----------|--------|
| **Shift+A** | Toggle add-node menu |
| **Esc** | Close add menu → clear selection |
| **Right-click** canvas | Open add-node menu |
| **Ctrl+A** | Select all |
| **Ctrl+D** | Duplicate |
| **Delete / Backspace** | Delete selection (canvas focused) |
| **Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y** | Undo / redo |

See node-animator `docs/architecture/10-editor-ux.md` for the full reference set.
