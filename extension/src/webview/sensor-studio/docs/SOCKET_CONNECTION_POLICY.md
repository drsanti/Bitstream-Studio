# Socket connection policy (Sensor Studio flow editor)

Central rules for wiring nodes on the React Flow canvas. Implemented in `features/editor/connect/socket-connection-policy.ts` and enforced via `FlowCanvas` (`isValidConnection`, `onConnectStart`, `onConnect`, `onReconnect`) and `flow-editor.store.ts` (`onConnect`, `onReconnect`, `popEdgesForSocketReconnect`).

Reference: node-animator `docs/socket-connection-policy.md` and `socketConnectionPolicy.ts`.

**Status:** **MVP + polish** — single-input replace, multi-input whitelist, pop-on-drag from wired inputs, `isValidConnection` during drag, rejection toasts, single undo step for pop+reconnect, **edge-end reconnect** (`reconnectWithPolicy` + React Flow `onReconnect`).

---

## Layers

| Layer | Purpose |
| ----- | ------- |
| **A. Topology** | Legal handle directions and graph shape |
| **B. Type** | Matching `StudioPortType` on source and target |
| **C. Cardinality** | Single vs multi wires per socket; replace vs fan-in |
| **D. Domain** | Layout reroute/split, groups, model scope (store hooks after connect) |

---

## A — Topology

| ID | Rule |
| -- | ---- |
| A1 | Wires go **output → input** (React Flow `source` / `target` roles). |
| A2 | **No self-loop** — `source` and `target` node ids must differ. |
| A3 | **No duplicate edge** — same `(source, sourceHandle, target, targetHandle)` cannot exist twice. |
| A4 | All four handles required on **commit**; incomplete connections allowed during drag (`isValidConnection` + `allowIncomplete: true`). |

---

## B — Type

Uses the same checks as legacy `canConnect`: studio pins, layout `layoutNodeAcceptsInput`, group I/O, `resolveFlowSourcePortType` / group port resolution.

---

## C — Cardinality

| ID | Rule |
| -- | ---- |
| C1 | **Default input = single** — at most one committed wire per `(target, targetHandle)`. |
| C2 | **Single input + replace** — a new connect **removes** the previous wire to that socket, then adds the new edge (Blender-style). |
| C3 | **Default output = multi** — one output may fan out to many targets. |
| C4 | **Multi-input (explicit)** — only sockets in `MULTI_INPUT_SOCKETS` accept fan-in. |

### Multi-input sockets (current)

| Catalog `nodeId` | Handle | Notes |
| ---------------- | ------ | ----- |
| `number-average` | `in` | Eval averages all incoming number wires |
| `studio-group-output` | *(interface socket)* | When socket `portType` is `glbAnimation` — many animation players may fan in |

### Single-output sockets (current)

| Catalog `nodeId` | Handle | Notes |
| ---------------- | ------ | ----- |
| *(none in v0.1)* | — | Register in `SINGLE_OUTPUT_SOCKETS` when a node must have one outgoing wire |

---

## Reconnect UX (pop on drag-start)

| Gesture | Behavior |
| ------- | -------- |
| Drag from **wired single input** | Existing incoming edge(s) to that socket are **removed** first (undo step), then the connection drag proceeds. |
| Drag from **multi input** | Wires are **not** popped on drag-start; new connects **add** another wire (replace list empty). |
| Drag from **output** | Outgoing wires are **not** popped unless the socket is listed in `SINGLE_OUTPUT_SOCKETS` (none in v0.1). |

Releasing on empty canvas after pop-without-reconnect still triggers **smart connect** when the drag started from a socket.

---

## API

```ts
validateStudioConnection(connection, graph, options?) → { ok: true } | { ok: false; reason }

connectWithPolicy(connection, graph) → { ok: true; edges; removedEdgeIds } | { ok: false; reason }

edgesToPopOnConnectStart(nodeId, handleId, handleType, nodes, edges) → string[]
```

---

## Product choices (locked)

1. **Single inputs:** replace old wire (do not reject with “socket full”).
2. **Outputs:** fan-out allowed.
3. **Cycles:** not blocked at connect time.
4. **Reconnect:** input-side pop-on-drag; output-side pop when `SINGLE_OUTPUT_SOCKETS` lists the catalog node + handle.

---

## Related files

| File | Role |
| ---- | ---- |
| `connect/socket-connection-policy.ts` | Policy implementation |
| `components/FlowCanvas.tsx` | `isValidConnection`, pop in `onConnectStart` |
| `store/flow-editor.store.ts` | `onConnect`, `popEdgesForSocketReconnect` |
| `docs/SMART_CONNECT.md` | Empty-canvas add-node after failed / cancelled connect |

---

## User feedback

Rejected connections show a **react-toastify** toast (`connection-feedback.ts`):

- **Warning** — type mismatch, self-loop, missing endpoints on commit
- **Info** — duplicate edge (already connected)

Toasts fire when the user releases a wire over a socket but React Flow did not connect (`onConnectEnd` + `validateStudioConnection`).

## Backlog

- Register catalog nodes in `SINGLE_OUTPUT_SOCKETS` when product requires exclusive outputs.
