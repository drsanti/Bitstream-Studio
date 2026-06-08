export const MAX_MAINTAINER_UNDO = 50;

export type HistoryStacks<T> = {
  undo: T[];
  redo: T[];
};

export const EMPTY_HISTORY_STACKS: HistoryStacks<never> = { undo: [], redo: [] };

export function pushHistorySnapshot<T>(
  stacks: HistoryStacks<T>,
  snapshot: T,
): HistoryStacks<T> {
  return {
    undo: [...stacks.undo, snapshot].slice(-MAX_MAINTAINER_UNDO),
    redo: [],
  };
}

export function undoHistory<T>(
  stacks: HistoryStacks<T>,
  current: T,
): { stacks: HistoryStacks<T>; snapshot: T | null } {
  if (stacks.undo.length === 0) {
    return { stacks, snapshot: null };
  }
  const prev = stacks.undo[stacks.undo.length - 1]!;
  return {
    stacks: {
      undo: stacks.undo.slice(0, -1),
      redo: [current, ...stacks.redo].slice(0, MAX_MAINTAINER_UNDO),
    },
    snapshot: prev,
  };
}

export function redoHistory<T>(
  stacks: HistoryStacks<T>,
  current: T,
): { stacks: HistoryStacks<T>; snapshot: T | null } {
  if (stacks.redo.length === 0) {
    return { stacks, snapshot: null };
  }
  const next = stacks.redo[0]!;
  return {
    stacks: {
      undo: [...stacks.undo, current].slice(-MAX_MAINTAINER_UNDO),
      redo: stacks.redo.slice(1),
    },
    snapshot: next,
  };
}
