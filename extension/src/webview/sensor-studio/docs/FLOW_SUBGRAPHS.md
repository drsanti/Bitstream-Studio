# Flow subgraphs (node groups)

Reference: node-animator [`13-subgraph-groups.md`](../../../../../../node-animator/docs/architecture/13-subgraph-groups.md).

Sensor Studio collapses selected nodes into a **`studio-node-group`** shell on the parent graph, stores inner content in **`subgraphs[id]`**, and **flattens** groups for simulation via **`flattenFlowGraphForEvaluation`**.

## Data model

| Field | Role |
|-------|------|
| `rootNodes` / `rootEdges` | Evaluation source when drilled into a group |
| `subgraphs[id]` | Inner `nodes`, `edges`, and typed `interface` |
| `activeGraphId` | `"__root__"` or group id shown in the canvas |
| `graphStack` | Parent chain for breadcrumb / Shift+Tab |

## UX (Phase 9 slice 1)

| Action | Binding |
|--------|---------|
| Group selection | **Ctrl+G** |
| Enter group | **Tab** (one group selected) or double-click group |
| Exit group | **Shift+Tab** |
| Breadcrumb | Top-left overlay on the flow canvas |

## Implementation map

| Module | Role |
|--------|------|
| `subgraphs/studio-subgraph.types.ts` | Types, guards, default interface |
| `subgraphs/create-studio-node-group.ts` | Collapse selection + boundary wiring |
| `subgraphs/rewire-parent-graph-for-group.ts` | Parent crossing edges → group sockets |
| `subgraphs/flatten-flow-graph-for-evaluation.ts` | Simulation flatten |
| `layout-nodes/NodeGroupLayoutNode.tsx` | Group shell + dynamic handles |
| `layout-nodes/GroupInputLayoutNode.tsx` / `GroupOutputLayoutNode.tsx` | Boundary nodes |
| `store/flow-editor.store.ts` | `createGroupFromSelection`, drill-in/out, eval hook |

## Backlog

- Subgraph-aware clipboard paste (clone inner graphs on paste)
- Ungroup (**Ctrl+Shift+G**)
- Group Sockets inspector (+/−, reorder, relabel)
- Linked vs deep-copy group instances

See also [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md) Phase 9.
