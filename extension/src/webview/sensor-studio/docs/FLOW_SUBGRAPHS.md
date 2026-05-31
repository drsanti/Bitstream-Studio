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

## UX (Phase 9)

| Action | Binding |
|--------|---------|
| Group selection | **Ctrl+G** |
| Ungroup selection | **Ctrl+Shift+G** (one group selected) |
| Enter group | **Tab** (one group selected) or double-click group |
| Exit group | **Shift+Tab** |
| Copy / paste groups | **Ctrl+C** / **Ctrl+V** (includes `subgraphs` payload) |
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
| `subgraphs/paste-subgraph-groups.ts` | Clipboard / duplicate subgraph clone |
| `subgraphs/dissolve-studio-node-group.ts` | Ungroup + parent edge rewire |
| `subgraphs/clone-studio-subgraph.ts` | Deep clone nested subgraph documents |
| `clipboard/flow-clipboard.ts` | `subgraphs` in copy/paste payload |

| `store/flow-editor.store.ts` | `createGroupFromSelection`, `ungroupSelection`, drill-in/out, eval hook |

## Backlog

- Group Sockets inspector (+/−, reorder, relabel)
- Linked vs deep-copy group instances (explicit duplicate mode)

See also [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md) Phase 9.
