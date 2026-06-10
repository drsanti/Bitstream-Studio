import type { KonvaGroupShapeV1, KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaConnectorShape, isKonvaGroupShape } from "../../schemas/konvaShapes";
import {
  findKonvaShapeById,
  getKonvaTopLevelShapeWorldBounds,
  rebaseKonvaShapeToLocalOrigin,
  rebaseKonvaShapeToWorldOrigin,
} from "./konvaShapeTree";

let groupSequence = 0;

function nextGroupId(): string {
  groupSequence += 1;
  return `konva-group-${Date.now().toString(36)}-${groupSequence}`;
}

export function listKonvaGroupableShapeIds(
  shapes: KonvaShapeV1[],
  selectedIds: string[],
): string[] {
  const selected = new Set(selectedIds);
  return shapes
    .filter((shape) => selected.has(shape.id) && !isKonvaConnectorShape(shape))
    .map((shape) => shape.id);
}

export function canGroupKonvaShapes(shapes: KonvaShapeV1[], selectedIds: string[]): boolean {
  return listKonvaGroupableShapeIds(shapes, selectedIds).length >= 2;
}

export function canUngroupKonvaShape(shapes: KonvaShapeV1[], selectedIds: string[]): boolean {
  if (selectedIds.length !== 1) {
    return false;
  }
  const selectedId = selectedIds[0];
  if (selectedId == null) {
    return false;
  }
  const shape = findKonvaShapeById(shapes, selectedId);
  return shape != null && isKonvaGroupShape(shape) && shape.children.length > 0;
}

/** Group top-level selected shapes into a new group at the selection union-bbox origin. */
export function groupKonvaShapes(
  shapes: KonvaShapeV1[],
  selectedIds: string[],
): KonvaShapeV1[] | null {
  const groupableIds = listKonvaGroupableShapeIds(shapes, selectedIds);
  if (groupableIds.length < 2) {
    return null;
  }

  const selected = new Set(groupableIds);
  const selectedShapes = shapes.filter((shape) => selected.has(shape.id));
  const bounds = selectedShapes.map((shape) => getKonvaTopLevelShapeWorldBounds(shape));
  const originX = Math.min(...bounds.map((entry) => entry.x));
  const originY = Math.min(...bounds.map((entry) => entry.y));

  const children = selectedShapes.map((shape) =>
    rebaseKonvaShapeToLocalOrigin(shape, originX, originY),
  );

  const topIndex = Math.max(...groupableIds.map((id) => shapes.findIndex((shape) => shape.id === id)));

  const group: KonvaGroupShapeV1 = {
    id: nextGroupId(),
    type: "group",
    x: originX,
    y: originY,
    children,
  };

  const next: KonvaShapeV1[] = [];
  let groupInserted = false;
  for (let index = 0; index < shapes.length; index += 1) {
    const entry = shapes[index];
    if (entry == null) {
      continue;
    }
    if (selected.has(entry.id)) {
      if (index === topIndex && !groupInserted) {
        next.push(group);
        groupInserted = true;
      }
      continue;
    }
    next.push(entry);
  }
  if (!groupInserted) {
    next.push(group);
  }
  return next;
}

function ungroupKonvaGroupAt(
  group: KonvaGroupShapeV1,
): KonvaShapeV1[] {
  return group.children.map((child) =>
    rebaseKonvaShapeToWorldOrigin(child, group.x, group.y),
  );
}

/** Ungroup a group (top-level or nested) back into parent / canvas coordinates. */
export function ungroupKonvaShape(shapes: KonvaShapeV1[], groupId: string): KonvaShapeV1[] | null {
  const topIndex = shapes.findIndex((shape) => shape.id === groupId);
  if (topIndex >= 0) {
    const shape = shapes[topIndex];
    if (shape == null || !isKonvaGroupShape(shape)) {
      return null;
    }
    const restored = ungroupKonvaGroupAt(shape);
    const next = [...shapes];
    next.splice(topIndex, 1, ...restored);
    return next;
  }

  let replaced = false;
  const walk = (entries: KonvaShapeV1[]): KonvaShapeV1[] =>
    entries.flatMap((entry) => {
      if (entry.id === groupId && isKonvaGroupShape(entry)) {
        replaced = true;
        return ungroupKonvaGroupAt(entry);
      }
      if (isKonvaGroupShape(entry)) {
        return [{ ...entry, children: walk(entry.children) }];
      }
      return [entry];
    });

  const next = walk(shapes);
  return replaced ? next : null;
}

export function duplicateKonvaGroupShape(
  shape: KonvaGroupShapeV1,
  idFactory: () => string,
  offset = 16,
): KonvaGroupShapeV1 {
  const idMap = new Map<string, string>();

  const cloneShape = (entry: KonvaShapeV1): KonvaShapeV1 => {
    const nextId = idFactory();
    idMap.set(entry.id, nextId);
    if (isKonvaGroupShape(entry)) {
      return {
        ...entry,
        id: nextId,
        x: entry.x,
        y: entry.y,
        children: entry.children.map(cloneShape),
      };
    }
    if (isKonvaConnectorShape(entry)) {
      const duplicated = rebaseKonvaShapeToWorldOrigin(entry, 0, 0);
      return {
        ...duplicated,
        id: nextId,
        x1: duplicated.x1 + offset,
        y1: duplicated.y1 + offset,
        x2: duplicated.x2 + offset,
        y2: duplicated.y2 + offset,
        startAttach: undefined,
        endAttach: undefined,
      };
    }
    return {
      ...entry,
      id: nextId,
      x: entry.x + offset,
      y: entry.y + offset,
    };
  };

  return {
    ...shape,
    id: idFactory(),
    x: shape.x + offset,
    y: shape.y + offset,
    children: shape.children.map(cloneShape),
  };
}
