import type { LayoutNode } from "./types";

const DEFAULT_MAX = 40;

let past: LayoutNode[] = [];
let future: LayoutNode[] = [];
let skipDepth = 0;

function getMaxSteps(): number {
  const raw = (globalThis as { __layoutHistoryMaxSteps?: number }).__layoutHistoryMaxSteps;
  return Math.max(10, Math.min(100, Math.round(raw ?? DEFAULT_MAX)));
}

function trim(): void {
  const max = getMaxSteps();
  if (past.length > max) {
    past = past.slice(past.length - max);
  }
  if (future.length > max) {
    future = future.slice(future.length - max);
  }
}

function layoutsEqual(a: LayoutNode, b: LayoutNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function pushLayoutHistory(before: LayoutNode): void {
  if (skipDepth > 0) {
    return;
  }
  const last = past[past.length - 1];
  if (last && layoutsEqual(last, before)) {
    return;
  }
  past.push(structuredClone(before));
  future = [];
  trim();
}

export function runWithoutLayoutHistory(fn: () => void): void {
  skipDepth++;
  try {
    fn();
  } finally {
    skipDepth = Math.max(0, skipDepth - 1);
  }
}

export function undoLayout(current: LayoutNode): LayoutNode | null {
  const prev = past.pop();
  if (!prev) {
    return null;
  }
  future.push(structuredClone(current));
  trim();
  return prev;
}

export function redoLayout(current: LayoutNode): LayoutNode | null {
  const next = future.pop();
  if (!next) {
    return null;
  }
  past.push(structuredClone(current));
  trim();
  return next;
}

export function canUndoLayout(): boolean {
  return past.length > 0;
}

export function canRedoLayout(): boolean {
  return future.length > 0;
}

export function clearLayoutHistory(): void {
  past = [];
  future = [];
}
