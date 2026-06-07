# Flow & group library

**Status:** Phase 1 shipped (2026-06-07); Phase 2 planned  
**Related:** [`FLOW_SUBGRAPHS.md`](./FLOW_SUBGRAPHS.md), [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md), `persistence/flow-preset-library.repository.ts`, `persistence/node-group-library.repository.ts`

## Goals

Operators can **save**, **organize**, **load**, **export**, **import**, and **share** flow graphs and reusable node groups without relying on hard-coded demo templates alone.

## Library shell

**One workbench pane (“Library”), Saved tab with two inner tabs:**

| Tab | Contents |
|-----|----------|
| **Flows** | Full graphs + partial selections (`trn-flow-preset`) |
| **Groups** | Reusable node groups (`trn-node-asset`) |

Catalog **Nodes** and **Simulation** tabs remain in the same pane for adding blocks from the node catalog.

**Storage v1:** `localStorage` (`sensor-studio:flow-preset-library:v1`, `sensor-studio:node-group-library:v1`).  
**Later:** workspace folder `.bitstream/library/` for team packs.

## Save routing

Single **Save to library** action; destination is inferred from canvas selection:

| Selection | Target | Payload |
|-----------|--------|---------|
| **Nothing selected** | Flow library | Full graph at **active graph level** (root = entire project; drilled-in = current subgraph canvas) |
| **Exactly one** `studio-node-group` only | Group library | `StudioNodeAssetFile` |
| **Any other selection** | Flow library | Partial flow preset (selected nodes, internal edges, nested subgraphs) |

Mixed selection (one group + other nodes) → **partial flow**, not group library.

## Load flow preset

Show a **Replace / Merge** dialog before applying:

| Mode | Behavior |
|------|----------|
| **Replace** | Clear active graph scope, load preset, reset drill to Root when loading a full root preset |
| **Merge** | Paste preset nodes at offset with fresh ids (same as Ctrl+V merge semantics) |

**Groups** dragged from library always **merge** (instantiate) — no replace dialog.

## Categories

Fixed enum on save/edit:

`telemetry` · `audio` · `animation` · `stage` · `vision` · `scene` · `utility` · `custom`

Free-text **tags** for search. Built-in demo templates remain under Canvas Inspector → Starter graph until migrated to an Official flows index (backlog).

## File formats

### Flow preset — `trn-flow-preset`

```json
{
  "marker": "trn-flow-preset",
  "version": 1,
  "meta": {
    "id": "…",
    "name": "TESA drone animation mix",
    "category": "animation",
    "description": "…",
    "tags": ["demo"],
    "presetKind": "flowFull",
    "activeGraphId": "__root__",
    "sourceScopeId": "__root__",
    "createdAt": "…",
    "updatedAt": "…"
  },
  "document": {
    "version": 1,
    "nodes": [],
    "edges": [],
    "subgraphs": {}
  },
  "dependencies": { "modelUrls": [], "dataChannels": [] }
}
```

`presetKind`: `flowFull` | `flowPartial`

### Group preset — `trn-node-asset`

Unchanged — see `subgraphs/node-library/studio-node-asset-file.ts`.

## Clipboard & import router

On **Ctrl+V** or **Import from clipboard**, try in order:

1. `trn-node-asset` → group library or canvas drop
2. `trn-flow-preset` → load dialog (Replace / Merge)
3. `sensor-studio-flow-clipboard` → selection paste (existing)
4. Raw `version: 1` flow document → load dialog

## Dependencies on import

List missing `modelUrls` / catalog node ids in a post-import hint (Phase 2 polish). Store `dependencies` on save from graph scan.

## Implementation map

| Module | Role |
|--------|------|
| `flow-library/studio-flow-preset-file.ts` | Types, parse, serialize, download |
| `flow-library/build-flow-preset-from-canvas.ts` | Full / partial document builder |
| `flow-library/resolve-save-to-library-target.ts` | Selection → flow / group |
| `flow-library/parse-flow-import-payload.ts` | Clipboard / file format router |
| `flow-library/merge-flow-document-into-canvas.ts` | Merge load path |
| `persistence/flow-preset-library.repository.ts` | localStorage CRUD |
| `components/node-palette/FlowLibraryTabPanel.tsx` | Flows tab UI |
| `components/node-palette/StudioSavedLibraryPanel.tsx` | Flows \| Groups inner tabs |
| `components/flow-library/SaveToLibraryDialog.tsx` | Name / category save |
| `components/flow-library/FlowLoadModeDialog.tsx` | Replace / Merge |
| `flow-library/remote-flow-preset-index.ts` | Online official flows index |
| `flow-library/use-remote-flow-presets.ts` | Official flows sync hook |
| `components/flow-library/SaveToLibraryDialogHost.tsx` | Global save dialog |
| `flow-library/build-flow-import-dependency-hint.ts` | Post-import asset hint |
| `store/flow-editor.store.ts` | `flowPresetLibrary`, save/load, remote presets |

## Phases

| Phase | Scope |
|-------|--------|
| **1 (shipped)** | Flow preset CRUD, Saved tab, save routing, load dialog, clipboard router, **Ctrl+Shift+S**, category filter, import dependency hint |
| **2 (in progress)** | Official remote flows index (`libraries/flow-preset/`), edit preset metadata in library |
| **3** | Workspace folder sync; linked preset update from canvas |
