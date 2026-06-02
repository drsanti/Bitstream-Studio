# Smart connect (socket drag → Add Node menu)

Design for **contextual node creation** when the user drags a wire from a socket and releases on empty canvas.

**Status:** Spec accepted — **implementation next** (see `extension/docs/DEVELOPMENT_TRACKER.md`).

**Related UI:** `FlowAddNodeMenu.tsx` (Shift+A), `FlowCanvas.tsx` (`onConnectStart` / `onConnectEnd`), `list-addable-catalog-entries.ts`.

---

## Current behavior

| Action | Result |
| ------ | ------ |
| Drag from socket → drop on compatible socket | Edge created (`onConnect` → store) |
| Drag from socket → drop on empty pane | Connection preview cancelled; **nothing else** |
| Shift+A or pane context menu | `FlowAddNodeMenu` at pointer; **no port-type filter** |

Connection line color already follows source port type (`handleConnectStart` in `FlowCanvas.tsx`).

---

## Target behavior

When the user **starts** a connection from a handle and **ends** on the pane (no valid target handle):

1. Open **`FlowAddNodeMenu`** at the **mouse-up** position (flow coordinates).
2. **Filter and rank** catalog entries by socket **direction** and **port type**.
3. On pick: **spawn node** at drop position and **auto-connect** the best matching port on the new node.
4. On menu close / Esc: same as today (no node, no edge).

### Modifier keys (while dragging)

Show hints in the **canvas footer** only during an active connection drag (after a short delay, e.g. 150ms).

| Modifier | Effect |
| -------- | ------ |
| *(none)* | Filtered menu + auto-connect |
| **Shift** | Full Add menu (unfiltered); compatible nodes still ranked at top |
| **Alt** | Place node at drop; **do not** auto-connect |

**Footer copy (draft):**

- Default: `Release on empty canvas to add a compatible node`
- Shift: `Shift — full Add menu`
- Alt: `Alt — place without auto-connect`

Use inline footer text (not native `title` tooltips).

---

## Trigger conditions

Fire **smart connect** only when **all** are true:

- `onConnectEnd` reports drop on **pane** (not on a handle).
- Drag started from a **handle** with known `nodeId`, `handleId`, `handleType` (`source` | `target`).
- Optional: pointer moved ≥ **8px** from start (ignore accidental click-drag).

Do **not** fire when the user connected successfully to a handle (normal `onConnect` path).

---

## Menu filtering

### Direction

| Drag start | User needs | Filter |
| ---------- | ---------- | ------ |
| **Output** (`handleType === "source"`) | A consumer | Nodes with ≥1 **input** port accepting the source **port type** |
| **Input** (`handleType === "target"`) | A producer | Nodes with ≥1 **output** port of that **port type** |

### Type matching

1. **Exact** port type match (e.g. `number` → `number`, `boolean` → `boolean`).
2. **Compatible** types if the graph already allows them (document per-type rules in `smart-connect-catalog.ts` when implemented).
3. Lower priority: generic utilities (Math, Clamp, Compare, Plotter, etc.) that accept the type.

### Ranking (top suggestions)

Within the filtered set, boost (non-exhaustive):

- **Recent** catalog ids (`recent-catalog-nodes.ts`).
- Single obvious sink/source (e.g. `plotter`, `gauge`, `sparkline` for `number` outputs).
- Nodes already used in the same **display group** as the source node.

**Shift** bypasses the filter but keeps ranking.

---

## Auto-connect after pick

Given `connectContext` (source node, handle, direction, port type) and chosen `NodeCatalogEntry`:

1. Create flow node at `flowPosition` (existing spawn path used by Shift+A).
2. Resolve **target handle** on the new node:
   - One match → use it.
   - Multiple matches → prefer catalog **primary** port id (e.g. first `inputPorts` / `outputPorts` in catalog); else first compatible port.
   - No match → spawn only (optional toast: “No compatible port — connect manually”).
3. Build `Connection` and call store `onConnect` (same validation as manual wiring).

**Alt:** skip steps 2–3.

---

## Implementation plan

| Step | Work |
| ---- | ---- |
| **S1** | Extend `FlowAddNodeMenu` props: optional `connectFilter?: { direction, portType, sourceNodeId? }`, `rankingHints`, `showUnfiltered` (Shift). |
| **S2** | Add `smart-connect-catalog.ts`: `filterEntriesForConnect()`, `rankEntriesForConnect()`, `resolveAutoConnectHandles()`. |
| **S3** | `FlowCanvas`: track `connectDragRef` in `onConnectStart`; in `onConnectEnd`, detect pane drop + call `openAddNodeMenuAt` with filter context. |
| **S4** | Wire `onPickEntry` to spawn + auto-connect unless Alt held at drop. |
| **S5** | Footer hint component on canvas chrome; subscribe to `connectingLineStroke != null` + `shiftKey` / `altKey` on `window` during drag. |
| **S6** | Tests: filter/rank pure functions; one integration test for handle resolution. |

### Files (expected touch)

- `features/editor/components/FlowCanvas.tsx`
- `features/editor/components/FlowAddNodeMenu.tsx`
- `features/editor/connect/smart-connect-catalog.ts` (new)
- `features/editor/components/flow-toolbar/FlowCanvasToolbar.tsx` or canvas footer host (hint strip)
- `docs/SENSOR_STUDIO_NODE_UI_RULES.md` (pointer)

---

## Edge cases

- **Group / subgraph nodes:** use existing `resolveStudioGroupNodePortType` / `layout-port-resolution` for port types on grouped IO.
- **Layout nodes** (Frame, Note): not in smart-connect catalog unless they gain typed ports.
- **Zoom / pan:** menu anchor uses `screenToFlowPosition` for spawn; menu uses screen `clientX/Y` like today.
- **Multi-touch:** desktop mouse first; touch can mirror later.
- **Reduced motion:** footer hint only; no animated ring on selection (see `flow-node-selection.css`).

---

## Selection ring (shipped)

Studio catalog nodes and **Note** layout nodes use `.studio-flow-node--selected` + `::before` overlay.

- CSS: `features/editor/nodes/flow-node/flow-node-selection.css`
- Fine-tune outset: `inset: -1px` on `::before`
- Import: `FlowCanvas.tsx` imports selection CSS

Frame nodes keep `studio-frame-node--selected` dashed border in `layout-flow-nodes.css`.
