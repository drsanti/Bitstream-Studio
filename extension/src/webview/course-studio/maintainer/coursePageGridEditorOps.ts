import { dashboardPlacementCellKeys } from "../../sensor-studio/core/dashboard/dashboard-placement";
import {
  applyDashboardGridMoveDelta,
  dashboardMultiGridResizeUpdates,
  nudgeDashboardGridPlacement,
  previewDashboardMultiGridResize,
  resolveDashboardMultiResizeContext,
  type DashboardGridMoveEntry,
  type DashboardGridNudgeDirection,
} from "../../sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { PageBlockV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";

function placementFits(
  placement: GridPlacementV1,
  occupied: ReadonlySet<string>,
  columns: number,
): boolean {
  if (placement.column + placement.columnSpan - 1 > columns) {
    return false;
  }
  for (const key of dashboardPlacementCellKeys(placement)) {
    if (occupied.has(key)) {
      return false;
    }
  }
  return true;
}

export function resolvePageSelectionMoveEntries(
  blocks: readonly PageBlockV1[],
  selectedIds: readonly string[],
): DashboardGridMoveEntry[] {
  const idSet = new Set(selectedIds);
  return blocks
    .filter((block) => idSet.has(block.id))
    .map((block) => ({
      sourceNodeId: block.id,
      placement: block.placement,
      groupParentId: null,
    }));
}

export function pageGridOtherPlacements(
  blocks: readonly PageBlockV1[],
  excludeIds: ReadonlySet<string>,
  placementFor: (blockId: string, placement: GridPlacementV1) => GridPlacementV1,
): GridPlacementV1[] {
  return blocks
    .filter((block) => !excludeIds.has(block.id))
    .map((block) => placementFor(block.id, block.placement));
}

export function nudgePageGridPlacement(args: {
  placement: GridPlacementV1;
  direction: DashboardGridNudgeDirection;
  blocks: readonly PageBlockV1[];
  selectedIds: ReadonlySet<string>;
  placementFor: (blockId: string, placement: GridPlacementV1) => GridPlacementV1;
  gridColumns: number;
}): GridPlacementV1 | null {
  return nudgeDashboardGridPlacement({
    placement: args.placement,
    direction: args.direction,
    gridColumns: args.gridColumns,
    otherPlacements: pageGridOtherPlacements(
      args.blocks,
      args.selectedIds,
      args.placementFor,
    ),
  });
}

export function nudgePageGridMultiMove(args: {
  entries: readonly DashboardGridMoveEntry[];
  direction: DashboardGridNudgeDirection;
  blocks: readonly PageBlockV1[];
  placementFor: (blockId: string, placement: GridPlacementV1) => GridPlacementV1;
  gridColumns: number;
}): Array<{ blockId: string; placement: GridPlacementV1 }> | null {
  if (args.entries.length === 0) {
    return null;
  }
  const delta =
    args.direction === "up"
      ? { rowDelta: -1, columnDelta: 0 }
      : args.direction === "down"
        ? { rowDelta: 1, columnDelta: 0 }
        : args.direction === "left"
          ? { rowDelta: 0, columnDelta: -1 }
          : { rowDelta: 0, columnDelta: 1 };
  const selectedIds = new Set(args.entries.map((entry) => entry.sourceNodeId));
  const staticPlacements = pageGridOtherPlacements(
    args.blocks,
    selectedIds,
    args.placementFor,
  );
  const occupied = new Set<string>();
  for (const placement of staticPlacements) {
    for (const key of dashboardPlacementCellKeys(placement)) {
      occupied.add(key);
    }
  }
  const updates: Array<{ blockId: string; placement: GridPlacementV1 }> = [];
  for (const entry of args.entries) {
    const base = args.placementFor(entry.sourceNodeId, entry.placement);
    const next = applyDashboardGridMoveDelta(base, delta);
    if (!placementFits(next, occupied, args.gridColumns)) {
      return null;
    }
    for (const key of dashboardPlacementCellKeys(next)) {
      occupied.add(key);
    }
    updates.push({ blockId: entry.sourceNodeId, placement: next });
  }
  return updates;
}

export function resolvePageMultiResizeContext(entries: readonly DashboardGridMoveEntry[]) {
  return resolveDashboardMultiResizeContext(entries);
}

export function previewPageMultiGridResize(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: GridPlacementV1;
  nextUnion: GridPlacementV1;
}): Record<string, GridPlacementV1> {
  return previewDashboardMultiGridResize(args);
}

export function pageMultiGridResizeUpdates(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: GridPlacementV1;
  nextUnion: GridPlacementV1;
}): Array<{ blockId: string; placement: GridPlacementV1 }> {
  return dashboardMultiGridResizeUpdates(args).map((update) => ({
    blockId: update.sourceNodeId,
    placement: update.placement,
  }));
}
