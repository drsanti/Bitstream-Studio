import type { FreeAssetIndexEntry, FreeLocalAssetEntry } from "../../model-downloader/protocol";
import type { SortDirection } from "../ui/components/SortableTable";
import { classifyFreeAssetKind, type FreeAssetKind } from "./freeAssetKind";

export type { SortDirection };

export type OnlineSortColumn = "kind" | "file" | "size";
export type LocalSortColumn = "kind" | "file" | "size" | "modified";

export interface TableSortState<Col extends string> {
  columnId: Col;
  direction: SortDirection;
}

const KIND_RANK: Record<FreeAssetKind, number> = {
  model: 0,
  texture: 1,
  data: 2,
  other: 3,
};

export const DEFAULT_ONLINE_SORT: TableSortState<OnlineSortColumn> = {
  columnId: "file",
  direction: "asc",
};

export const DEFAULT_LOCAL_SORT: TableSortState<LocalSortColumn> = {
  columnId: "file",
  direction: "asc",
};

function comparePath(a: string, b: string, dir: SortDirection): number {
  const c = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? c : -c;
}

function compareKindPaths(aPath: string, bPath: string, dir: SortDirection): number {
  const ra = KIND_RANK[classifyFreeAssetKind(aPath)];
  const rb = KIND_RANK[classifyFreeAssetKind(bPath)];
  if (ra !== rb) {
    return dir === "asc" ? ra - rb : rb - ra;
  }
  return comparePath(aPath, bPath, "asc");
}

export function toggleColumnSort<Col extends string>(
  current: TableSortState<Col>,
  clicked: Col
): TableSortState<Col> {
  if (current.columnId !== clicked) {
    return { columnId: clicked, direction: "asc" };
  }
  return {
    columnId: clicked,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function sortOnlineEntries(
  rows: FreeAssetIndexEntry[],
  sort: TableSortState<OnlineSortColumn>
): FreeAssetIndexEntry[] {
  const copy = [...rows];
  const { columnId, direction: dir } = sort;
  copy.sort((a, b) => {
    switch (columnId) {
      case "kind":
        return compareKindPaths(a.relativePath, b.relativePath, dir);
      case "file":
        return comparePath(a.relativePath, b.relativePath, dir);
      case "size": {
        const na = a.sizeBytes;
        const nb = b.sizeBytes;
        if (na === null && nb === null) {
          return comparePath(a.relativePath, b.relativePath, "asc");
        }
        if (na === null) {
          return 1;
        }
        if (nb === null) {
          return -1;
        }
        const diff = na - nb;
        if (diff !== 0) {
          return dir === "asc" ? diff : -diff;
        }
        return comparePath(a.relativePath, b.relativePath, "asc");
      }
      default:
        return 0;
    }
  });
  return copy;
}

export function sortLocalEntries(
  rows: FreeLocalAssetEntry[],
  sort: TableSortState<LocalSortColumn>
): FreeLocalAssetEntry[] {
  const copy = [...rows];
  const { columnId, direction: dir } = sort;
  copy.sort((a, b) => {
    switch (columnId) {
      case "kind":
        return compareKindPaths(a.relativePath, b.relativePath, dir);
      case "file":
        return comparePath(a.relativePath, b.relativePath, dir);
      case "size": {
        const diff = a.sizeBytes - b.sizeBytes;
        if (diff !== 0) {
          return dir === "asc" ? diff : -diff;
        }
        return comparePath(a.relativePath, b.relativePath, "asc");
      }
      case "modified": {
        const diff = a.modifiedAtMs - b.modifiedAtMs;
        if (diff !== 0) {
          return dir === "asc" ? diff : -diff;
        }
        return comparePath(a.relativePath, b.relativePath, "asc");
      }
      default:
        return 0;
    }
  });
  return copy;
}
