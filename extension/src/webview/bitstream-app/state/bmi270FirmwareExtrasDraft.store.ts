/*******************************************************************************
 * File Name : bmi270FirmwareExtrasDraft.store.ts
 *
 * Description : Draft vs firmware baseline for BMI270 output mode and fusion feed
 *               when Sensor Telemetry Configuration pane defers firmware apply.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { Bmi270StreamModeUi } from "./bitstreamConfig.store.js";
import { useBitstreamConfigStore } from "./bitstreamConfig.store.js";

interface Bmi270FirmwareExtrasDraftState {
  /** True while Telemetry Configuration pane uses draft-until-Apply for BMI270 extras. */
  deferFirmwareApply: boolean;
  streamModeBaseline: Bmi270StreamModeUi | null;
  fusionFeedBaselineMs: number | null;
  /** User changed output mode or fusion feed in Configuration (until Apply/Revert). */
  extrasUserEdited: boolean;
  setDeferFirmwareApply: (defer: boolean) => void;
  markExtrasUserEdited: () => void;
  clearExtrasUserEdited: () => void;
  commitStreamModeBaseline: (mode: Bmi270StreamModeUi) => void;
  commitFusionFeedBaseline: (intervalMs: number) => void;
  resetBaselines: () => void;
}

export const useBmi270FirmwareExtrasDraftStore = create<Bmi270FirmwareExtrasDraftState>((set) => ({
  deferFirmwareApply: false,
  streamModeBaseline: null,
  fusionFeedBaselineMs: null,
  extrasUserEdited: false,

  setDeferFirmwareApply: (defer) => {
    set({ deferFirmwareApply: defer });
  },

  markExtrasUserEdited: () => {
    set({ extrasUserEdited: true });
  },

  clearExtrasUserEdited: () => {
    set({ extrasUserEdited: false });
  },

  commitStreamModeBaseline: (mode) => {
    set({ streamModeBaseline: mode });
  },

  commitFusionFeedBaseline: (intervalMs) => {
    set({ fusionFeedBaselineMs: intervalMs });
  },

  resetBaselines: () => {
    set({ streamModeBaseline: null, fusionFeedBaselineMs: null, extrasUserEdited: false });
  },
}));

/** True when draft output mode differs from last firmware baseline (defer mode only). */
export function isBmi270StreamModeDraftDirty(): boolean
{
  const { deferFirmwareApply, streamModeBaseline } = useBmi270FirmwareExtrasDraftStore.getState();
  if (!deferFirmwareApply)
  {
    return false;
  }
  /* No GET baseline yet — treat as dirty so Apply pushes BMI270_MODE_SET. */
  if (streamModeBaseline == null)
  {
    return true;
  }
  return useBitstreamConfigStore.getState().bmi270StreamMode !== streamModeBaseline;
}

/** True when draft fusion feed interval differs from firmware baseline (defer mode only). */
export function isBmi270FusionFeedDraftDirty(): boolean
{
  const { deferFirmwareApply, fusionFeedBaselineMs } = useBmi270FirmwareExtrasDraftStore.getState();
  if (!deferFirmwareApply)
  {
    return false;
  }
  if (fusionFeedBaselineMs == null)
  {
    return true;
  }
  return useBitstreamConfigStore.getState().bmi270FusionFeedIntervalMs !== fusionFeedBaselineMs;
}

/** Either BMI270 extra field is unsaved while defer apply is active. */
export function isBmi270FirmwareExtrasDirty(): boolean
{
  const { deferFirmwareApply, extrasUserEdited } = useBmi270FirmwareExtrasDraftStore.getState();
  if (!deferFirmwareApply)
  {
    return false;
  }
  if (extrasUserEdited)
  {
    return true;
  }
  return isBmi270StreamModeDraftDirty() || isBmi270FusionFeedDraftDirty();
}

/** Copy firmware baselines back into the UI draft fields. */
export function revertBmi270FirmwareExtrasDraftToBaseline(): void
{
  const { streamModeBaseline, fusionFeedBaselineMs } = useBmi270FirmwareExtrasDraftStore.getState();
  const cfg = useBitstreamConfigStore.getState();
  if (streamModeBaseline != null)
  {
    cfg.setBmi270StreamMode(streamModeBaseline);
  }
  if (fusionFeedBaselineMs != null)
  {
    cfg.setBmi270FusionFeedIntervalMs(fusionFeedBaselineMs);
  }
  useBmi270FirmwareExtrasDraftStore.getState().clearExtrasUserEdited();
}
