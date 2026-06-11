# Physics Lab — scene editor UX (outliner, selection, hierarchy)

**Status:** Design  
**Parent:** [`PHYSICS_LAB.md`](./PHYSICS_LAB.md)  
**Canonical 3D reference:** [`SCENE_3D_EDITOR.md`](../../../course-studio/docs/SCENE_3D_EDITOR.md)  
**Reference repo:** `3DPhysicsEngine` — `Hierarchy.tsx`, `Viewport.tsx`, `sceneCommands.ts`

Physics Lab should feel like a **professional game / DCC editor**, not a demo canvas. Reuse Bitstream patterns where they already ship; port 3DPhysicsEngine behaviors where they do not.

---

## Design principle: one selection model everywhere

| Surface | Same state |
|---------|------------|
| 3D viewport | click, shift-click, box select |
| Scene outliner | click, shift-click, ctrl/cmd-click |
| Inspector | edits **active** object; batch fields when multi-select is homogeneous |

**Active vs selected** (Blender-style):

- **`selectedIds`** — ordered set; last id = **active** (gizmo anchor, inspector primary).
- Viewport gizmo moves **all selected** bodies/groups when transforms are compatible.
- Outliner row colors sync with viewport highlights (`diagram3dSelectionAppearance` pattern).

---

## Scene outliner (hierarchy tree)

Left column **Outliner** is always visible (factory panel stacks above or tabs with it). Tree shows the **scene graph**, not only flat Rapier bodies.

### Tree contents

| Node kind | Icon | Physics |
|-----------|------|---------|
| **World** | Globe | root — not selectable as a body |
| **Group** | Folder | transform parent only; no collider until “Convert to body” |
| **Body** | Cube | rigid body (fixed / dynamic / kinematic) |
| **Collider** | Wireframe box | child of body — local offset editing |
| **Joint** | Link | pseudo-node under connected bodies or Joints folder |
| **Spawner** | Droplets | optional folder |

Imported GLB (`car_colliders.glb`) opens as a **prefab subtree** (root group → body + wheels + collider children) per [`VEHICLE_GLB_AUTHORING.md`](../../vehicle-physics/docs/VEHICLE_GLB_AUTHORING.md).

### Outliner interactions

| Action | Behavior |
|--------|----------|
| **Click** | Select node; set active |
| **Shift+click** | Extend selection |
| **Ctrl/Cmd+click** | Toggle in selection |
| **Double-click** | Rename (inline) or **frame in viewport** |
| **Drag row** | Reorder among siblings (`sortOrder`) |
| **Drop on row** | Reparent under target group/body |
| **Drop between rows** | Insert at sibling index |
| **Drop on empty** | Move to scene root |
| **Expand/collapse** | Persist per scene in editor prefs |

Invalid reparent (cycle: group under its descendant) — reject with hint toast; no-op.

### Outliner chrome

- **Search/filter** — name, tag, `factoryRole`, motion type.
- **Visibility** (eye) — hide in viewport; does not remove from sim unless “exclude from export”.
- **Pick lock** (padlock) — exclude from raycast pick.
- **Sim lock** — fixed in Simulate mode (editor-only flag).
- **Issue badge** — validation count per subtree (`validatePlayScene` pattern).

Toolbar: **Add empty group**, **Add body**, **Delete**, **Duplicate** — mirror viewport shortcuts.

Implementation target: **`TRNTree`** (3DPhysicsEngine) or **`CourseSceneOutliner`** row pattern with physics-specific icons.

---

## Viewport selection

### Raycast pick

| Input | Result |
|-------|--------|
| **Click** object | Select that scene node; clear others |
| **Shift+click** | Add/remove from selection |
| **Click empty** | Clear selection (unless modifier held) |

**Pick layer** toolbar chip: `Visual` | `Collider` | `Both` — raycast against mesh bounds or collider wire hulls.

Depth sort: closest hit; prefer **active** layer when Visual+Collider overlap.

### Box (marquee) selection

Match Course Studio 3D:

- **Shift+drag** on empty viewport → screen-space rectangle.
- Objects whose **projected bounds** intersect the rect join selection (replace unless Shift also held for additive — match Course: Shift+drag replaces; Shift+click toggles).
- Works in **perspective and orthographic**.
- Marquee overlay: semi-transparent fill + border (reuse `CourseSceneEditorViewport` / `scene3dViewportMarquee` helpers).

For **ortho**, use same projection as pick (no separate code path).

### Selection highlights

Reuse **`diagram3dSelectionAppearance`** concepts:

| Role | Viewport | Outliner |
|------|----------|----------|
| Selected | Box outline + optional silhouette | Tinted row |
| Active | Thicker outline / amber accent | Bold label |

**Physics-specific overlays** (toggles in Viewport card):

| Overlay | When |
|---------|------|
| **Collider wireframe** | Selected bodies — always in Edit; optional for all |
| **COM marker** | Selected dynamic bodies |
| **Joint axes** | Selected joints |
| **Contact points** | Simulate mode debug |
| **Sleep state** | Dim sleeping bodies |

**X-ray:** selected mesh 50% opacity so embedded colliders read clearly (Car Factory).

Configurable colors: port `Scene3dSelectionAppearancePrefs` → `PhysicsLabSelectionAppearancePrefs`.

---

## Hierarchy and transforms

### Parent-child rules

| Parent | Child allowed |
|--------|----------------|
| **Group** | group, body, imported GLB root |
| **Body** | collider nodes (logical children), visual-only mesh nodes |
| **World root** | groups, bodies |

Reparenting updates **`parentId`** + preserves **world pose** by default (Blender *Keep Transform*).

Modes (context menu / shortcuts):

| Command | Shortcut (proposed) |
|---------|---------------------|
| Group selection | **Ctrl+G** |
| Parent → Object | **Ctrl+P** → Object |
| Parent → Keep Transform | **Ctrl+P** → Keep Transform |
| Clear parent | **Alt+P** |
| Duplicate | **Ctrl+D** |
| Delete | **Delete** / **X** |
| Frame selection | **.** (numpad period) |

Reference implementations: `scene3dHierarchyOps.ts`, `CourseSceneParentMenu.tsx`.

### Gizmo

- **G / R / S** — translate / rotate / scale (scale affects visual + collider params where applicable).
- Gizmo on **active** object; applies to full selection for shared ops.
- **Edit mode:** Rapier paused; transforms write to `PhysicsSceneV1`.
- **Simulate mode:** gizmo disabled (or “kinematic grab” deferred to P3+).

**Collider local gizmo:** when pick layer = Collider and a collider child is active, gizmo edits `localTransform` on that collider only.

---

## Schema: scene graph in `PhysicsSceneV1`

Flat `bodies[]` remains the **Rapier bake input**, but the Lab editor maintains an optional **tree** for outliner and parenting.

```ts
type PhysicsSceneNodeKind = "group" | "body" | "colliderRef" | "visualRef";

type PhysicsSceneNodeV1 = {
  id: string;
  label: string;
  kind: PhysicsSceneNodeKind;
  parentId: string | null;
  sortOrder: number;
  /** body id when kind === body | colliderRef */
  bodyId?: string;
  colliderId?: string;
  /** Group/local transform (editor + export). Baked to world for Rapier. */
  localTransform: PhysicsTransformV1;
  visible?: boolean;
  pickLocked?: boolean;
  tags?: string[];
};

// On PhysicsSceneV1:
nodes?: PhysicsSceneNodeV1[];   // when absent, infer flat root list from bodies[]
```

**Bake pipeline:** `resolveWorldTransforms(nodes, bodies)` → world poses for `buildRapierWorldFromPhysicsSceneV1`. Graph export can flatten or preserve groups as `collider-group` / future group nodes.

---

## Professional features (beyond this doc)

Authoring modes, collision matrix, compound collider editor, validation/repair, materials, CCD, debug overlays, prefabs, and the full **P0–P8** roadmap live in:

**[`PHYSICS_LAB_PROFESSIONAL_FEATURES.md`](./PHYSICS_LAB_PROFESSIONAL_FEATURES.md)**

This document covers **outliner, selection, hierarchy, and gizmo** only.

---

## Shared module plan

Extract from Course Studio + new physics glue under `webview/shared/viewport/`:

| Module | Source |
|--------|--------|
| Marquee / box select | `CourseSceneEditorViewport` + `scene3dViewportMarquee*` |
| Selection appearance | `diagram3dSelectionAppearance.ts` |
| Hierarchy ops | `scene3dHierarchyOps.ts` — adapt to `PhysicsSceneNodeV1` |
| Outliner rows | `CourseSceneOutliner.tsx` — generalize or duplicate thin |
| Transform gizmo | `TransformControls` wrapper from Course / Stage |
| Projection toggle | `studio-viewport-projection.ts` |

Physics-only in `physics-lab/core/`:

| Module | Role |
|--------|------|
| `physicsLabSelectionStore.ts` | selectedIds, activeId, pick layer |
| `physicsLabOutliner.tsx` | TRNTree + DnD |
| `physicsLabViewportPick.ts` | R3F raycast + marquee → body/node ids |
| `physicsLabSelectionOverlay.tsx` | wireframes, COM, contacts |
| `physicsLabHierarchyCommands.ts` | reparent, group, undoable |

---

## Phasing (editor features)

| Phase | Editor deliverable |
|-------|-------------------|
| **P0** | Single select, outliner list (flat), delete, frame, Edit/Simulate |
| **P1** | Multi-select, shift box select, collider wireframe, undo/redo |
| **P2** | Tree DnD reparent, groups, gizmo multi-transform, highlight prefs |
| **P3** | Collider-child pick, local gizmo, isolation, validation badges |
| **P4** | Search/filter, hide/lock, snap, prefab save, collision groups UI |

---

## Testing checklist

| Case | Expected |
|------|----------|
| Shift+drag box | All enclosed bodies selected; outliner sync |
| Reparent wheel under chassis | World pose preserved; compound still valid |
| Cycle reparent attempt | Blocked |
| Select collider child | Wireframe + local gizmo; body not double-moved |
| Hide in outliner | Mesh/collider debug hidden; sim unchanged unless export flag |
| Undo reparent | Tree + transforms restored |
| Export to graph | Stable ids; flattened or grouped per export option |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | Initial scene editor spec — outliner, selection, hierarchy, pro feature roadmap |
