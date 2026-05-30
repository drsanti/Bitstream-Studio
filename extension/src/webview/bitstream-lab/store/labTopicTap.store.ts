/*******************************************************************************
 * File Name : labTopicTap.store.ts
 *
 * Description : Ring buffer of captured broker messages for Topic Tap.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { LabTapEntry } from "../types/labTypes";

const DEFAULT_MAX = 500;

export type LabTopicTapState = {
  entries: LabTapEntry[];
  paused: boolean;
  filter: string;
  throttleEvtSensor: boolean;
  maxEntries: number;
  selectedId: string | null;
  append: (entry: Omit<LabTapEntry, "id">) => void;
  setPaused: (paused: boolean) => void;
  setFilter: (filter: string) => void;
  setThrottleEvtSensor: (on: boolean) => void;
  setSelectedId: (id: string | null) => void;
  clear: () => void;
  exportText: () => string;
};

let tapSeq = 0;

export const useLabTopicTapStore = create<LabTopicTapState>((set, get) => ({
  entries: [],
  paused: false,
  filter: "",
  throttleEvtSensor: true,
  maxEntries: DEFAULT_MAX,
  selectedId: null,

  append: (partial) => {
    if (get().paused)
    {
      return;
    }
    const id = `tap-${Date.now()}-${tapSeq++}`;
    const entry: LabTapEntry = { id, ...partial };
    set((state) => {
      const next = [...state.entries, entry];
      const trimmed = next.length > state.maxEntries ? next.slice(-state.maxEntries) : next;
      return {
        entries: trimmed,
        selectedId: state.selectedId ?? id,
      };
    });
  },

  setPaused: (paused) => {
    set({ paused });
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setThrottleEvtSensor: (throttleEvtSensor) => {
    set({ throttleEvtSensor });
  },

  setSelectedId: (selectedId) => {
    set({ selectedId });
  },

  clear: () => {
    set({ entries: [], selectedId: null });
  },

  exportText: () => {
    const { entries } = get();
    return entries
      .map((e) => `[${new Date(e.atMs).toISOString()}] ${e.channel} ${e.topic} qos=${e.qos}\n${e.payloadPreview}`)
      .join("\n\n");
  },
}));
