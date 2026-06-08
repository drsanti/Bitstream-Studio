# Flow subgraphs (node groups)

Reference: node-animator [`13-subgraph-groups.md`](../../../../../../node-animator/docs/architecture/13-subgraph-groups.md).

Sensor Studio collapses selected nodes into a **`studio-node-group`** shell on the parent graph, stores inner content in **`subgraphs[id]`**, and **flattens** groups for simulation via **`flattenFlowGraphForEvaluation`**.

## Data model

| Field | Role |
|-------|------|
| `rootNodes` / `rootEdges` | Evaluation source when drilled into a group |
| `subgraphs[id]` | Inner `nodes`, `edges`, and typed `interface` |
| `activeGraphId` | `"__root__"` or group id shown in the canvas (in-memory + JSON import/export) |
| `graphStack` | Parent chain for breadcrumb / Shift+Tab |
| **Browser refresh** | localStorage hydrate always opens **Root**; breadcrumb hidden until you drill in again (`resolveRootCanvasViewOnHydrate`) |

## UX (Phase 9)

| Action | Binding |
|--------|---------|
| Group selection | **Ctrl+G** |
| Ungroup selection | **Ctrl+Shift+G** (one group selected) |
| Enter group | **Tab** (one group selected) or double-click group |
| Exit group | **Shift+Tab** |
| Copy / paste groups | **Ctrl+C** / **Ctrl+V** (includes `subgraphs` payload) |
| Group Sockets inspector | Select group shell (or boundary node inside) → rename, add/remove/reorder typed inputs/outputs; socket defaults and promote-crossings |
| Group Input / Output cards | Inside a group: compact **200px** boundary nodes; **Group Input** socket rows match catalog **flex output** layout (`[live \| type] [name] (●)→`); live scalars during sim |
| Duplicate linked / deep copy | Inspector **Duplicate linked** (shared inner graph) or **Duplicate deep copy** (independent clone) |
| Group library | Inspector **Save to library** / **Export preset** / **Load preset into group**; Library **Presets → Groups** tab + canvas drag |
| Flow library | Palette **Presets → Flows** — save full/partial flow presets, Replace/Merge load, import/export; see [`FLOW_LIBRARY.md`](./FLOW_LIBRARY.md) |
| Remote official presets | **`libraries/node-graph/index.json`** on online asset base; **Presets → Groups** tab **Official** section |
| Linked preset sync | Inspector **Update from library** / **Break library link** |
| Breadcrumb | Bottom-center minimal single-row pill (parent icon + trail); hidden on **Root** |

## Implementation map

| Module | Role |
|--------|------|
| `subgraphs/studio-subgraph.types.ts` | Types, guards, default interface |
| `subgraphs/create-studio-node-group.ts` | Collapse selection + boundary wiring |
| `subgraphs/rewire-parent-graph-for-group.ts` | Parent crossing edges → group sockets |
| `subgraphs/flatten-flow-graph-for-evaluation.ts` | Simulation flatten |
| `layout-nodes/NodeGroupLayoutNode.tsx` | Group shell + dynamic handles |
| `layout-nodes/GroupInputLayoutNode.tsx` / `GroupOutputLayoutNode.tsx` | Boundary node hosts |
| `layout-nodes/StudioGroupBoundaryCard.tsx` | Boundary card chrome |
| `layout-nodes/GroupBoundarySocketRows.tsx` | Shared socket rows (`FlowNodeSocketRow`) |
| `layout-nodes/group-boundary-socket-live-preview.tsx` | Boundary row live readout |
| `subgraphs/studio-group-boundary-live.ts` | Sim: flattened pins → boundary `live*ByHandle` |
| `layout-nodes/studio-group-boundary-node-chrome.ts` | Draggable boundary nodes + z-index |
| `subgraphs/paste-subgraph-groups.ts` | Clipboard / duplicate subgraph clone |
| `subgraphs/dissolve-studio-node-group.ts` | Ungroup + parent edge rewire |
| `subgraphs/clone-studio-subgraph.ts` | Deep clone nested subgraph documents |
| `subgraphs/studio-group-interface-sync.ts` | Interface edit + parent edge cleanup |
| `subgraphs/duplicate-group-instance.ts` | Linked vs deep-copy group duplicates |
| `subgraphs/node-library/remote-node-graph-index.ts` | Online index + asset fetch |
| `subgraphs/node-library/normalize-node-asset-for-studio.ts` | node-animator → studio type mapping |
| `subgraphs/node-library/use-remote-node-graph-presets.ts` | Groups tab remote loader hook |
| `components/node-palette/StudioSavedLibraryPanel.tsx` | **Presets** tab shell (Flows \| Groups) |
| `components/node-palette/FlowLibraryTabPanel.tsx` | Flow preset list + save/load |
| `components/node-palette/GroupLibraryTabPanel.tsx` | Saved group presets + import/drag |
| `persistence/node-group-library.repository.ts` | localStorage group library |
| `persistence/flow-preset-library.repository.ts` | localStorage flow preset library |
| `components/inspector/NodeGroupInspectorSection.tsx` | Group Sockets inspector UI |
| `clipboard/flow-clipboard.ts` | `subgraphs` in copy/paste payload |

| `store/flow-editor.store.ts` | `createGroupFromSelection`, `ungroupSelection`, drill-in/out, eval hook |

## Backlog

- (none for v0.1 — official group cache badges shipped in **Presets → Groups**; see [`FLOW_LIBRARY.md`](./FLOW_LIBRARY.md))

See also [`FLOW_LIBRARY.md`](./FLOW_LIBRARY.md), [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md) Phase 9.
