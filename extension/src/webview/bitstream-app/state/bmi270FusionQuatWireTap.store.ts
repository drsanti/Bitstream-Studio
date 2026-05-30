import { create } from "zustand";
import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";
import {
  extractNormalizedQuatFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "../components/3d-rotation/shared/bmi270FusionExtract.js";
import {
  createEmptyFusionQuatGateState,
  evaluateFusionQuatWireFrame,
  type FusionQuatGateRejectReason,
  type FusionQuatGateState,
} from "../components/3d-rotation/shared/fusionQuatOutlierGate.js";
import { useBitstreamConfigStore } from "./bitstreamConfig.store.js";
import type { Bmi270LiveSample, Bmi270ResolvedSample } from "../types/bitstreamWorkspaceTypes.js";

let fusionQuatGateState: FusionQuatGateState = createEmptyFusionQuatGateState();

/**
 * **Wire-rate** fusion quaternion tap for the quaternion **plot overlay** only.
 * 3D mesh + telemetry deck use {@link useBmi270FusionQuatOrientationStore} (no spike reject).
 *
 * Optional spike gate drops single-frame outliers from the overlay ring buffer only.
 */
export type Bmi270FusionQuatWireTapState = {
  seq: number;
  /** Incremented on {@link reset}; overlay clears ring buffers when this changes. */
  clearToken: number;
  /** Wire packet timestamp in ms (Date.now), updated per accepted quaternion sample. */
  lastAtMs: number | null;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  /** Rejected frames since last {@link reset} (spike gate). */
  spikeRejectedSinceReset: number;
  /** Last reject reason when {@link spikeRejectedSinceReset} increased (diagnostics). */
  lastSpikeRejectReason: FusionQuatGateRejectReason | null;
  pushFromWireSample: (sample: BitstreamSensorSampleV2) => void;
  reset: () => void;
};

export const useBmi270FusionQuatWireTapStore = create<Bmi270FusionQuatWireTapState>((set) => ({
  seq: 0,
  clearToken: 0,
  lastAtMs: null,
  qw: 1,
  qx: 0,
  qy: 0,
  qz: 0,
  spikeRejectedSinceReset: 0,
  lastSpikeRejectReason: null,

  pushFromWireSample: (sample) => {
    if (sample.sourceHint !== "bmi270") {
      return;
    }
    if (!hasFusionQuaternionWireFields(sample as Bmi270ResolvedSample)) {
      return;
    }
    const incoming = extractNormalizedQuatFromBmi270Sample(sample as Bmi270LiveSample);
    const cfg = useBitstreamConfigStore.getState();
    const nowMs = Date.now();
    const decision = evaluateFusionQuatWireFrame({
      enabled: cfg.bmi270FusionQuatSpikeRejectEnabled,
      incoming,
      incomingCounter: sample.counter,
      gate: fusionQuatGateState,
      nowMs,
      feedIntervalMs: cfg.bmi270FusionFeedIntervalMs,
    });
    fusionQuatGateState = decision.nextGate;

    if (!decision.accept) {
      set((s) => ({
        spikeRejectedSinceReset: s.spikeRejectedSinceReset + 1,
        lastSpikeRejectReason: decision.reason,
      }));
      return;
    }

    const q = decision.aligned;
    set((s) => ({
      ...q,
      seq: s.seq + 1,
      lastAtMs: nowMs,
      lastSpikeRejectReason: null,
    }));
  },

  reset: () => {
    fusionQuatGateState = createEmptyFusionQuatGateState();
    set((s) => ({
      seq: 0,
      clearToken: s.clearToken + 1,
      lastAtMs: null,
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      spikeRejectedSinceReset: 0,
      lastSpikeRejectReason: null,
    }));
  },
}));
