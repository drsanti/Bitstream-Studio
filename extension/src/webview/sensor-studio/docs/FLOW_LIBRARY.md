# Flow & group library

**Status:** **Complete** (2026-06-07) — Phases 1–2, 3a, 3b, Groups parity, workspace sync bar  
**Related:** [`FLOW_SUBGRAPHS.md`](./FLOW_SUBGRAPHS.md), [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md), `persistence/flow-preset-library.repository.ts`, `persistence/node-group-library.repository.ts`

## Goals

Operators can **save**, **organize**, **load**, **export**, **import**, and **share** flow graphs and reusable node groups without relying on hard-coded demo templates alone.

## Library shell

**One workbench pane (“Library”), Presets tab with two inner tabs:**

| Tab | Contents |
|-----|----------|
| **Flows** | Full graphs + partial selections (`trn-flow-preset`) |
| **Groups** | Reusable node groups (`trn-node-asset`) |

Catalog **Nodes** and **Simulation** tabs remain in the same pane for adding blocks from the node catalog.

**Storage v1:** `localStorage` (`sensor-studio:flow-preset-library:v1`, `sensor-studio:node-group-library:v1`).  
**Phase 3a:** When a VS Code workspace folder is open, project presets also sync to `.bitstream/library/flows/` and `.bitstream/library/groups/` (merge by `updatedAt` on pull; debounced push on save).

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

## Linked project group update (Groups parity)

After **Save to library** (or **Load preset into group** from project library):

1. Session stores the linked group asset id/name.
2. The Project row is highlighted; a violet **Update** icon appears on that row.
3. **Update** overwrites the saved group preset from the linked **node group** on the canvas (metadata id/name/category preserved; `updatedAt` bumped).
4. Inspector **Browse in Library** opens Presets → Groups → Project and highlights the row.

## Linked project preset update (Phase 3b — Flows)

After **Replace** load of a **Project** preset (not Official):

1. Session stores the linked preset id/name.
2. The Project row is highlighted; a cyan **Update** icon appears on that row.
3. **Update** (or Document tab **Update linked preset**) overwrites the saved entry with the current canvas (metadata id/name/category preserved; `updatedAt` bumped).
4. **Merge** load clears the link. Loading an **Official** preset clears the project link (maintainer **Override** uses a separate session).

## Categories

Fixed enum on save/edit:

`telemetry` · `audio` · `animation` · `stage` · `vision` · `scene` · `utility` · `custom`

Free-text **tags** for search. Built-in demo templates also appear under **Presets → Flows → Official** (bundled + online pack). Canvas Inspector → **Browse in Library** focuses that pane and highlights the matching official preset.

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
| `components/flow-library/SaveToLibraryDialog.tsx` | Name / category / description save (flows + groups) |
| `flow-library/resolve-save-to-library-dialog-defaults.ts` | Dialog defaults + linked-preset banner |
| `components/flow-library/FlowLoadModeDialog.tsx` | Replace / Merge |
| `flow-library/remote-flow-preset-index.ts` | Online official flows index |
| `flow-library/use-remote-flow-presets.ts` | Official flows sync hook |
| `flow-library/flow-library-navigation.ts` | Document tab → Library focus + official row highlight |
| `components/flow-library/FlowLibraryOpenLink.tsx` | Inspector link to Presets → Flows → Official |
| `flow-library/flow-preset-maintainer-mode.ts` | Dev-only maintainer toggle (localStorage) |
| `flow-library/export-official-flow-preset-override.ts` | Export canvas as `official-*` override JSON |
| `components/flow-library/FlowPresetMaintainerTools.tsx` | Maintainer mode UI on Flows + Document tabs |
| `src/assets/libraries/flow-preset/overrides/` | Hand-tuned presets applied by `flow-preset:gen` |
| `components/flow-library/SaveToLibraryDialogHost.tsx` | Global save dialog |
| `flow-library/build-flow-import-dependency-hint.ts` | Post-import asset hint |
| `flow-library/flow-preset-linked-session.ts` | Linked project preset after Replace load |
| `flow-library/build-flow-preset-update-from-canvas.ts` | Rebuild preset document from canvas for update |
| `flow-library/request-project-flow-preset-update.ts` | Update confirm + row hints |
| `store/flow-editor.store.ts` | `flowPresetLibrary`, save/load, `updateFlowPresetFromCanvas` |
| `persistence/studio-library-workspace-session.ts` | Workspace sync state + pull/push/sync-now |
| `persistence/install-studio-library-workspace-sync.ts` | VS Code host wiring (debounced push) |
| `components/node-palette/StudioLibraryWorkspaceBar.tsx` | Workspace badge + **Sync now** (Presets tab) |
| `flow-library/group-preset-linked-session.ts` | Linked project group asset session |
| `components/flow-library/GroupLibraryOpenLink.tsx` | Inspector → Groups library highlight |

## Phases

| Phase | Scope |
|-------|--------|
| **1 (shipped)** | Flow preset CRUD, Presets tab, save routing, load dialog, clipboard router, **Ctrl+Shift+S**, category filter, import dependency hint |
| **2 (shipped)** | Bundled official demo exports (`npm run flow-preset:gen`), `libraries/flow-preset/` index + bundled fallback, edit preset metadata, Document tab **Browse in Library**, maintainer UI (`overrides/`, one-click **Override** icon per Official row — save + regen + stage + optional GitHub upload in Vite dev), CLI publish scripts |
| **3a (shipped)** | Workspace folder sync — `.bitstream/library/flows/` + `groups/` via extension host pull/push |
| **3b (shipped)** | Linked project preset: load with Replace → **Update** overwrites library entry from canvas (Presets row + Document tab) |
| **Groups parity (shipped)** | Toolbar **Save to library**, linked **Update** row, **Browse in Library**, category chips, tag chips |
| **Workspace UX (shipped)** | **StudioLibraryWorkspaceBar** — folder badge, **Sync now**, browser-dev hint |

## Backlog (post-v1)

- Official **group** maintainer Override pipeline (mirror Flows `flow-preset:gen` for `libraries/node-graph/`)
- Flows tab section-card UI parity with Groups (cosmetic)
