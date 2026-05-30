/*******************************************************************************
 * File Name : telemetryActivity.store.ts
 *
 * Description : Ring buffer of curated activity log lines for Sensor Telemetry.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { TelemetryActivityLine, TelemetryActivityTone } from "../types/telemetryTypes";

const DEFAULT_MAX = 200;

export type TelemetryActivityState = {
  lines: TelemetryActivityLine[];
  paused: boolean;
  maxLines: number;
  append: (partial: { text: string; tone?: TelemetryActivityTone; atMs?: number }) => void;
  setPaused: (paused: boolean) => void;
  clear: () => void;
  exportText: () => string;
};

let activitySeq = 0;

export const useTelemetryActivityStore = create<TelemetryActivityState>((set, get) => ({
  lines: [],
  paused: false,
  maxLines: DEFAULT_MAX,

  append: (partial) => {
    if (get().paused)
    {
      return;
    }
    const id = `tel-act-${Date.now()}-${activitySeq++}`;
    const line: TelemetryActivityLine = {
      id,
      atMs: partial.atMs ?? Date.now(),
      text: partial.text,
      tone: partial.tone ?? "info",
    };
    set((state) => {
      const next = [...state.lines, line];
      const trimmed = next.length > state.maxLines ? next.slice(-state.maxLines) : next;
      return { lines: trimmed };
    });
  },

  setPaused: (paused) => {
    set({ paused });
  },

  clear: () => {
    set({ lines: [] });
  },

  exportText: () => {
    const { lines } = get();
    return lines
      .map((l) => `[${new Date(l.atMs).toISOString()}] ${l.text}`)
      .join("\n");
  },
}));

/** Append outside React (shell hooks, session callbacks). */
export function appendTelemetryActivity(partial: {
  text: string;
  tone?: TelemetryActivityTone;
  atMs?: number;
}): void {
  useTelemetryActivityStore.getState().append(partial);
}
