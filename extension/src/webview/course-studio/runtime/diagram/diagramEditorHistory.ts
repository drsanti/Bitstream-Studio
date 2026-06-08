import type { DiagramV1 } from "../../schemas/diagram.v1";
import {
  EMPTY_HISTORY_STACKS,
  pushHistorySnapshot,
  redoHistory,
  undoHistory,
  type HistoryStacks,
} from "../../maintainer/historyStacks";

export const MAX_DIAGRAM_UNDO = 50;

export type DiagramHistoryStacks = HistoryStacks<DiagramV1>;

export const EMPTY_DIAGRAM_HISTORY: DiagramHistoryStacks = EMPTY_HISTORY_STACKS;

export function pushDiagramHistorySnapshot(
  stacks: DiagramHistoryStacks,
  snapshot: DiagramV1,
): DiagramHistoryStacks {
  return pushHistorySnapshot(stacks, snapshot);
}

export function undoDiagramHistory(
  stacks: DiagramHistoryStacks,
  current: DiagramV1,
): { stacks: DiagramHistoryStacks; draft: DiagramV1 | null } {
  const result = undoHistory(stacks, current);
  return { stacks: result.stacks, draft: result.snapshot };
}

export function redoDiagramHistory(
  stacks: DiagramHistoryStacks,
  current: DiagramV1,
): { stacks: DiagramHistoryStacks; draft: DiagramV1 | null } {
  const result = redoHistory(stacks, current);
  return { stacks: result.stacks, draft: result.snapshot };
}

export function canUndoDiagramHistory(stacks: DiagramHistoryStacks): boolean {
  return stacks.undo.length > 0;
}

export function canRedoDiagramHistory(stacks: DiagramHistoryStacks): boolean {
  return stacks.redo.length > 0;
}
