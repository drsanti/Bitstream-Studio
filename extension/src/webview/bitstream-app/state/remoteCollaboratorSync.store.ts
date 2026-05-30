import { create } from "zustand";

const DEBOUNCE_MS = 320;
const AUTO_HIDE_MS = 5600;
const MAX_LABELS_IN_LINE = 4;

function buildLine(labels: Set<string>): string | null {
  if (labels.size === 0) {
    return null;
  }
  const sorted = [...labels].sort((a, b) => a.localeCompare(b));
  const shown = sorted.slice(0, MAX_LABELS_IN_LINE);
  const extra = sorted.length - shown.length;
  const suffix = extra > 0 ? ` +${extra}` : "";
  return `Remote · ${shown.join(", ")}${suffix}`;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export type RemoteCollaboratorSyncState = {
  /** Aggregated one-line summary for the lifecycle strip (null when idle). */
  line: string | null;
  pendingLabels: Set<string>;
  enqueue: (label: string) => void;
  dismiss: () => void;
};

export const useRemoteCollaboratorSyncStore = create<RemoteCollaboratorSyncState>((set, get) => ({
  line: null,
  pendingLabels: new Set<string>(),

  enqueue: (label: string) => {
    const trimmed = label.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (hideTimer != null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    const nextPending = new Set(get().pendingLabels);
    nextPending.add(trimmed);
    set({ pendingLabels: nextPending });

    if (flushTimer != null) {
      clearTimeout(flushTimer);
    }
    flushTimer = setTimeout(() => {
      flushTimer = null;
      const labels = get().pendingLabels;
      const line = buildLine(labels);
      set({ pendingLabels: new Set<string>(), line });
      if (line == null) {
        return;
      }
      if (hideTimer != null) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        hideTimer = null;
        set({ line: null });
      }, AUTO_HIDE_MS);
    }, DEBOUNCE_MS);
  },

  dismiss: () => {
    if (flushTimer != null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (hideTimer != null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ line: null, pendingLabels: new Set<string>() });
  },
}));

/** Queue a collaborator-driven merge label; debounced into one lifecycle-bar line. */
export function enqueueRemoteCollaboratorSync(label: string): void {
  useRemoteCollaboratorSyncStore.getState().enqueue(label);
}
