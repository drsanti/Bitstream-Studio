/*******************************************************************************
 * File Name : bmi270FirmwareExtrasSync.ts
 *
 * Description : GET/SET helpers for BMI270 output mode and fusion feed interval
 *               (separate from SENSOR_CFG rows).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { markBmi270StreamModeColdSynced } from "../bmi270/bmi270StreamModeColdSync.js";
import { SENSOR_SOURCE_ID_BMI270 } from "../constants/sensorSourceIds.js";
import { BMI270_MODE_COMMAND_TIMEOUT_MS } from "../constants/sensorConfigPipeline.js";
import { inferBmi270StreamModeFromMask } from "../lib/bmi270OutputProfiles.js";
import { withTimeout } from "../utils/withTimeout.js";
import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store.js";
import {
  clampBmi270FusionFeedIntervalMs,
  useBitstreamConfigStore,
} from "../state/bitstreamConfig.store.js";
import {
  isBmi270FirmwareExtrasDirty,
  isBmi270FusionFeedDraftDirty,
  isBmi270StreamModeDraftDirty,
  useBmi270FirmwareExtrasDraftStore,
} from "../state/bmi270FirmwareExtrasDraft.store.js";

export type Bmi270FirmwareExtrasTransport = {
  getStreamMode: (timeoutMs?: number) => Promise<{ ok: boolean; mode: Bmi270StreamModeUi | null; error?: string }>;
  getFusionFeedIntervalMs: (timeoutMs?: number) => Promise<{ ok: boolean; intervalMs?: number | null; error?: string }>;
  setStreamMode: (
    mode: Bmi270StreamModeUi,
    timeoutMs?: number,
  ) => Promise<{ ok: boolean; appliedMode?: Bmi270StreamModeUi; error?: string }>;
  setFusionFeedIntervalMs: (
    intervalMs: number,
    timeoutMs?: number,
  ) => Promise<{ ok: boolean; appliedIntervalMs?: number; error?: string }>;
};

export type Bmi270FirmwareExtrasSyncResult =
  | { ok: true }
  | { ok: false; error: string };

/** Read BMI270 mode + fusion feed from firmware and commit UI + baselines. */
export async function syncBmi270FirmwareExtrasFromDevice(
  transport: Bmi270FirmwareExtrasTransport,
): Promise<Bmi270FirmwareExtrasSyncResult>
{
  const modeRes = await transport.getStreamMode(BMI270_MODE_COMMAND_TIMEOUT_MS);
  let resolvedMode = modeRes.ok ? modeRes.mode : null;
  if (resolvedMode == null)
  {
    const deviceStore = useBitstreamDeviceSensorConfigStore.getState();
    const bmi270Row =
      deviceStore.baselineBySourceId[SENSOR_SOURCE_ID_BMI270] ??
      deviceStore.bySourceId[SENSOR_SOURCE_ID_BMI270];
    resolvedMode =
      bmi270Row != null ? inferBmi270StreamModeFromMask(bmi270Row.mask) : null;
    if (resolvedMode == null)
    {
      return { ok: false, error: modeRes.error ?? "BMI270 mode GET failed" };
    }
  }

  const cfg = useBitstreamConfigStore.getState();
  const draftStore = useBmi270FirmwareExtrasDraftStore.getState();

  /* Always record firmware truth as baseline; only overwrite the UI draft when
     the user has not edited while the GETs were in flight. */
  draftStore.commitStreamModeBaseline(resolvedMode);
  if (!useBmi270FirmwareExtrasDraftStore.getState().extrasUserEdited)
  {
    cfg.setBmi270StreamMode(resolvedMode);
    markBmi270StreamModeColdSynced(resolvedMode);
  }

  const feedRes = await transport.getFusionFeedIntervalMs(BMI270_MODE_COMMAND_TIMEOUT_MS);
  if (feedRes.ok && feedRes.intervalMs != null)
  {
    const feedMs = clampBmi270FusionFeedIntervalMs(feedRes.intervalMs);
    draftStore.commitFusionFeedBaseline(feedMs);
    if (!useBmi270FirmwareExtrasDraftStore.getState().extrasUserEdited)
    {
      cfg.setBmi270FusionFeedIntervalMs(feedMs);
    }
  }

  return { ok: true };
}

/** Apply deferred BMI270 output mode and/or fusion feed when draft differs from baseline. */
export async function applyBmi270FirmwareExtrasIfDirty(
  transport: Bmi270FirmwareExtrasTransport,
): Promise<Bmi270FirmwareExtrasSyncResult>
{
  if (!isBmi270FirmwareExtrasDirty())
  {
    return { ok: true };
  }

  const cfg = useBitstreamConfigStore.getState();
  const draftStore = useBmi270FirmwareExtrasDraftStore.getState();

  const modeDirty = isBmi270StreamModeDraftDirty() || draftStore.extrasUserEdited;
  if (modeDirty)
  {
    try
    {
      const res = await withTimeout(
        transport.setStreamMode(cfg.bmi270StreamMode, BMI270_MODE_COMMAND_TIMEOUT_MS),
        BMI270_MODE_COMMAND_TIMEOUT_MS,
        "BMI270 mode command timed out",
      );
      if (!res.ok)
      {
        return { ok: false, error: res.error ?? "BMI270 mode SET failed" };
      }
      const applied = res.appliedMode ?? cfg.bmi270StreamMode;
      cfg.setBmi270StreamMode(applied);
      draftStore.commitStreamModeBaseline(applied);
      markBmi270StreamModeColdSynced(applied);
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }

  if (isBmi270FusionFeedDraftDirty())
  {
    const intervalMs = cfg.bmi270FusionFeedIntervalMs;
    try
    {
      const res = await withTimeout(
        transport.setFusionFeedIntervalMs(intervalMs, BMI270_MODE_COMMAND_TIMEOUT_MS),
        BMI270_MODE_COMMAND_TIMEOUT_MS,
        "BMI270 fusion feed command timed out",
      );
      if (!res.ok)
      {
        return { ok: false, error: res.error ?? "BMI270 fusion feed SET failed" };
      }
      const appliedMs = clampBmi270FusionFeedIntervalMs(res.appliedIntervalMs ?? intervalMs);
      cfg.setBmi270FusionFeedIntervalMs(appliedMs);
      draftStore.commitFusionFeedBaseline(appliedMs);
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }

  draftStore.clearExtrasUserEdited();
  return { ok: true };
}

/** Apply deferred BMI270 output / stream mode when draft differs from baseline. */
export async function applyBmi270StreamModeIfDirty(
  transport: Bmi270FirmwareExtrasTransport,
): Promise<Bmi270FirmwareExtrasSyncResult>
{
  if (!isBmi270StreamModeDraftDirty())
  {
    return { ok: true };
  }

  const cfg = useBitstreamConfigStore.getState();
  const draftStore = useBmi270FirmwareExtrasDraftStore.getState();

  try
  {
    const res = await withTimeout(
      transport.setStreamMode(cfg.bmi270StreamMode, BMI270_MODE_COMMAND_TIMEOUT_MS),
      BMI270_MODE_COMMAND_TIMEOUT_MS,
      "BMI270 mode command timed out",
    );
    if (!res.ok)
    {
      return { ok: false, error: res.error ?? "BMI270 mode SET failed" };
    }
    const applied = res.appliedMode ?? cfg.bmi270StreamMode;
    cfg.setBmi270StreamMode(applied);
    draftStore.commitStreamModeBaseline(applied);
    markBmi270StreamModeColdSynced(applied);
    if (!isBmi270FusionFeedDraftDirty())
    {
      draftStore.clearExtrasUserEdited();
    }
    return { ok: true };
  }
  catch (e: unknown)
  {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Apply deferred BMI270 fusion feed interval when draft differs from baseline. */
export async function applyBmi270FusionFeedIfDirty(
  transport: Bmi270FirmwareExtrasTransport,
): Promise<Bmi270FirmwareExtrasSyncResult>
{
  if (!isBmi270FusionFeedDraftDirty())
  {
    return { ok: true };
  }

  const cfg = useBitstreamConfigStore.getState();
  const draftStore = useBmi270FirmwareExtrasDraftStore.getState();
  const intervalMs = cfg.bmi270FusionFeedIntervalMs;

  try
  {
    const res = await withTimeout(
      transport.setFusionFeedIntervalMs(intervalMs, BMI270_MODE_COMMAND_TIMEOUT_MS),
      BMI270_MODE_COMMAND_TIMEOUT_MS,
      "BMI270 fusion feed command timed out",
    );
    if (!res.ok)
    {
      return { ok: false, error: res.error ?? "BMI270 fusion feed SET failed" };
    }
    const appliedMs = clampBmi270FusionFeedIntervalMs(res.appliedIntervalMs ?? intervalMs);
    cfg.setBmi270FusionFeedIntervalMs(appliedMs);
    draftStore.commitFusionFeedBaseline(appliedMs);
    if (!isBmi270StreamModeDraftDirty())
    {
      draftStore.clearExtrasUserEdited();
    }
    return { ok: true };
  }
  catch (e: unknown)
  {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
