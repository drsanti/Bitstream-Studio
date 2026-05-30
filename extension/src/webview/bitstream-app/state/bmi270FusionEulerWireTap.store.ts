import { create } from "zustand";
import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";
import { hasFusionEulerWireFields } from "../components/3d-rotation/shared/bmi270FusionExtract.js";
import type { Bmi270ResolvedSample } from "../types/bitstreamWorkspaceTypes.js";

/**
 * Wire-rate fusion Euler tap (pitch / roll / yaw in rad), one update per decoded BMI270 fusion packet.
 * Mirrors {@link useBmi270FusionQuatWireTapStore} for the Euler angles overlay.
 */
export type Bmi270FusionEulerWireTapState = {
  seq: number;
  clearToken: number;
  /** Wire packet timestamp in ms (Date.now), updated per accepted Euler sample. */
  lastAtMs: number | null;
  pitchRad: number;
  rollRad: number;
  yawRad: number;
  pushFromWireSample: (sample: BitstreamSensorSampleV2) => void;
  reset: () => void;
};

export const useBmi270FusionEulerWireTapStore = create<Bmi270FusionEulerWireTapState>((set) => ({
  seq: 0,
  clearToken: 0,
  lastAtMs: null,
  pitchRad: 0,
  rollRad: 0,
  yawRad: 0,

  pushFromWireSample: (sample) => {
    if (sample.sourceHint !== "bmi270") {
      return;
    }
    const s = sample as Bmi270ResolvedSample;
    if (!hasFusionEulerWireFields(s)) {
      return;
    }
    const pitchRad = s.fusionPitchRadX100 / 100;
    const rollRad = s.fusionRollRadX100 / 100;
    const yawRad = s.fusionHeadingRadX100 / 100;
    set((state) => ({
      pitchRad,
      rollRad,
      yawRad,
      seq: state.seq + 1,
      lastAtMs: Date.now(),
    }));
  },

  reset: () =>
    set((state) => ({
      seq: 0,
      clearToken: state.clearToken + 1,
      lastAtMs: null,
      pitchRad: 0,
      rollRad: 0,
      yawRad: 0,
    })),
}));
