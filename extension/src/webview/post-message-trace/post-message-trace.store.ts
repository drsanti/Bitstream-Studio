import { create } from "zustand";

export const POST_MESSAGE_TRACE_MAX = 400;

export type PostMessageTraceDirection = "webview→host" | "host→webview";

export interface PostMessageTraceEntry {
  id: string;
  ts: number;
  direction: PostMessageTraceDirection;
  typeLabel: string;
  detail: string;
}

interface PostMessageTraceStoreState {
  entries: PostMessageTraceEntry[];
  isOpen: boolean;
  paused: boolean;
  append: (input: { direction: PostMessageTraceDirection; payload: unknown }) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setPaused: (paused: boolean) => void;
}

function summarizePayload(payload: unknown): { typeLabel: string; detail: string } {
  if (payload == null) {
    return { typeLabel: String(payload), detail: "" };
  }
  if (typeof payload === "string") {
    const detail = payload.length > 600 ? `${payload.slice(0, 600)}…` : payload;
    return { typeLabel: "(string)", detail };
  }
  if (typeof payload === "object") {
    const t = (payload as Record<string, unknown>).type;
    const typeLabel = typeof t === "string" && t.length > 0 ? t : "(object)";
    let detail: string;
    try {
      detail = JSON.stringify(payload);
    } catch {
      detail = "[unserializable]";
    }
    if (detail.length > 800) {
      detail = `${detail.slice(0, 800)}…`;
    }
    return { typeLabel, detail };
  }
  const s = String(payload);
  return { typeLabel: typeof payload, detail: s.length > 200 ? `${s.slice(0, 200)}…` : s };
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const usePostMessageTraceStore = create<PostMessageTraceStoreState>((set, get) => ({
  entries: [],
  isOpen: false,
  paused: false,

  append: ({ direction, payload }) => {
    if (get().paused) return;
    const { typeLabel, detail } = summarizePayload(payload);
    const entry: PostMessageTraceEntry = {
      id: nextId(),
      ts: Date.now(),
      direction,
      typeLabel,
      detail,
    };
    set((s) => {
      const next = [...s.entries, entry];
      if (next.length > POST_MESSAGE_TRACE_MAX) {
        next.splice(0, next.length - POST_MESSAGE_TRACE_MAX);
      }
      return { entries: next };
    });
  },

  clear: () => set({ entries: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setPaused: (paused) => set({ paused }),
}));
