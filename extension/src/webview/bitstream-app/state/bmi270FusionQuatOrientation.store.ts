/*******************************************************************************
 * File Name : bmi270FusionQuatOrientation.store.ts
 *
 * Description : Wire-rate fusion quaternion for 3D orientation and telemetry deck.
 *               Pass-through decode only (no spike reject or display smoothing).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";
import {
  extractNormalizedQuatFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "../components/3d-rotation/shared/bmi270FusionExtract.js";
import type { Bmi270LiveSample, Bmi270ResolvedSample } from "../types/bitstreamWorkspaceTypes.js";

export type Bmi270FusionQuatOrientationState = {
  seq: number;
  lastAtMs: number | null;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  pushFromWireSample: (sample: BitstreamSensorSampleV2) => void;
  reset: () => void;
};

export const useBmi270FusionQuatOrientationStore = create<Bmi270FusionQuatOrientationState>(
  (set) => ({
    seq: 0,
    lastAtMs: null,
    qw: 1,
    qx: 0,
    qy: 0,
    qz: 0,

    pushFromWireSample: (sample) => {
      if (sample.sourceHint !== "bmi270") {
        return;
      }
      if (!hasFusionQuaternionWireFields(sample as Bmi270ResolvedSample)) {
        return;
      }
      const q = extractNormalizedQuatFromBmi270Sample(sample as Bmi270LiveSample);
      set((s) => ({
        qw: q.qw,
        qx: q.qx,
        qy: q.qy,
        qz: q.qz,
        seq: s.seq + 1,
        lastAtMs: Date.now(),
      }));
    },

    reset: () => {
      set({
        seq: 0,
        lastAtMs: null,
        qw: 1,
        qx: 0,
        qy: 0,
        qz: 0,
      });
    },
  }),
);
